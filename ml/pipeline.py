"""
TwinAero - shared fitting and evaluation helpers

Used by ml/train_and_evaluate.py (artifacts served by the API) and by
ml/experiments/run_experiments.py (ablation, transfer and decision studies), so the
benchmark numbers and the dashboard come from the same code path.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from ml.preprocessing.loader import (
    CMAPSSDataLoader, build_twin_features, last_cycle_rows, split_engines, twin_feature_columns,
)
from ml.rul.predictor import RULPredictor
from ml.uncertainty.conformal import CONFIDENCE_LEVELS, ConformalPredictor, CQRPredictor, interval_metrics

RUL_CLIP = 125


@dataclass
class SubsetData:
    subset: str
    loader: CMAPSSDataLoader
    train: pd.DataFrame          # proper-training engines, features built
    cal: pd.DataFrame            # held-out calibration engines, features built
    test: pd.DataFrame           # official test trajectories, features built
    test_rul: np.ndarray         # ground-truth RUL at the last test cycle (unclipped)
    train_ids: np.ndarray = field(default_factory=lambda: np.array([]))
    cal_ids: np.ndarray = field(default_factory=lambda: np.array([]))


def prepare_subset(subset: str, data_dir: str = 'data/raw', holdout_frac: float = 0.2, seed: int = 7,
                   scaler_from: Optional[CMAPSSDataLoader] = None) -> SubsetData:
    """Load a subset, split train engines into proper-train / calibration, build features.

    The regime scaler is fitted on proper-train engines only, unless `scaler_from`
    supplies one (used for cross-subset transfer)."""
    loader = CMAPSSDataLoader(data_dir=data_dir, max_rul_clip=RUL_CLIP)
    train_df, test_df, rul_true = loader.load_dataset(subset)
    train_ids, cal_ids = split_engines(train_df['engine_id'].unique(), holdout_frac, seed)
    proper = train_df[train_df['engine_id'].isin(train_ids)]
    cal = train_df[train_df['engine_id'].isin(cal_ids)]

    if scaler_from is not None:
        loader.regime_scaler = scaler_from.regime_scaler
    else:
        loader.fit_regime_standardization(proper)

    return SubsetData(
        subset=subset, loader=loader,
        train=build_twin_features(loader, proper), cal=build_twin_features(loader, cal),
        test=build_twin_features(loader, test_df), test_rul=rul_true,
        train_ids=train_ids, cal_ids=cal_ids,
    )


def X(df: pd.DataFrame, cols: List[str]) -> pd.DataFrame:
    return df[cols].fillna(0)


@dataclass
class FittedTwin:
    feature_cols: List[str]
    rul: RULPredictor
    split: ConformalPredictor
    cqr: Optional[CQRPredictor]


def fit_twin(train: pd.DataFrame, cal: pd.DataFrame, feature_cols: Optional[List[str]] = None,
             with_cqr: bool = True) -> FittedTwin:
    cols = feature_cols or twin_feature_columns()
    rul = RULPredictor()
    rul.fit(X(train, cols), train['clipped_rul'].values)
    split = ConformalPredictor(alpha=0.10)
    split.calibrate(cal['clipped_rul'].values, rul.predict(X(cal, cols)))
    cqr = None
    if with_cqr:
        cqr = CQRPredictor().fit(X(train, cols), train['clipped_rul'].values)
        cqr.calibrate(X(cal, cols), cal['clipped_rul'].values, cal_reference=rul.predict(X(cal, cols)))
    return FittedTwin(cols, rul, split, cqr)


def fit_twin_cross_conformal(train_all: pd.DataFrame, n_folds: int = 5, seed: int = 7,
                             feature_cols: Optional[List[str]] = None) -> Tuple[FittedTwin, pd.DataFrame]:
    """Cross-conformal calibration: every training engine contributes out-of-fold scores,
    and the final models are fitted on all engines. Returns the twin and out-of-fold rows
    (engine_id, cycle, y, oof_pred) for downstream threshold calibration."""
    cols = feature_cols or twin_feature_columns()
    ids = np.array(sorted(train_all['engine_id'].unique()))
    rng = np.random.default_rng(seed)
    folds = np.array_split(rng.permutation(ids), n_folds)

    oof_parts, split_scores, cqr_scores = [], [], {lv: [] for lv in CONFIDENCE_LEVELS}
    for hold in folds:
        tr = train_all[~train_all['engine_id'].isin(hold)]
        ho = train_all[train_all['engine_id'].isin(hold)]
        y_ho = ho['clipped_rul'].values.astype(float)
        rul = RULPredictor()
        rul.fit(X(tr, cols), tr['clipped_rul'].values)
        pred = rul.predict(X(ho, cols))
        q = CQRPredictor().fit(X(tr, cols), tr['clipped_rul'].values)
        for lv, sc in q.scores(X(ho, cols), y_ho).items():
            cqr_scores[lv].append(sc)
        split_scores.append(np.abs(y_ho - pred))
        oof_parts.append(pd.DataFrame({'engine_id': ho['engine_id'].values, 'cycle': ho['cycle'].values,
                                       'y': y_ho, 'oof_pred': pred}))
    oof = pd.concat(oof_parts, ignore_index=True)

    rul = RULPredictor()
    rul.fit(X(train_all, cols), train_all['clipped_rul'].values)
    split = ConformalPredictor(alpha=0.10)
    split.calibrate(np.concatenate(split_scores), np.zeros(len(oof)))
    cqr = CQRPredictor().fit(X(train_all, cols), train_all['clipped_rul'].values)
    cqr.set_calibration({lv: np.concatenate(v) for lv, v in cqr_scores.items()}, oof['oof_pred'].values, oof['y'].values)
    return FittedTwin(cols, rul, split, cqr), oof


def recalibrate(twin: FittedTwin, cal: pd.DataFrame) -> FittedTwin:
    """Label-based self-calibration: refit conformal corrections on new run-to-failure data."""
    split = ConformalPredictor(alpha=0.10)
    split.calibrate(cal['clipped_rul'].values, twin.rul.predict(X(cal, twin.feature_cols)))
    cqr = None
    if twin.cqr is not None:
        cqr = CQRPredictor(levels=twin.cqr.levels)
        cqr.models, cqr.feature_columns = twin.cqr.models, twin.cqr.feature_columns
        cqr.calibrate(X(cal, twin.feature_cols), cal['clipped_rul'].values,
                      cal_reference=twin.rul.predict(X(cal, twin.feature_cols)))
    return FittedTwin(twin.feature_cols, twin.rul, split, cqr)


def evaluate_last_cycle(twin: FittedTwin, test: pd.DataFrame, test_rul: np.ndarray) -> Dict:
    last = last_cycle_rows(test)
    y = np.minimum(test_rul, RUL_CLIP).astype(float)
    pred = twin.rul.predict(X(last, twin.feature_cols))
    out = {'point': twin.rul.evaluate(y, pred), 'split': {}, 'cqr': {}, 'cqr_fleet_adapted': {}}
    if twin.cqr is not None:
        twin.cqr.adapt_to_fleet(pred)
    for lv in CONFIDENCE_LEVELS:
        lo, hi, _ = twin.split.predict_interval(pred, confidence=lv)
        out['split'][str(lv)] = interval_metrics(y, lo, hi, lv)
        if twin.cqr is not None:
            lo, hi = twin.cqr.predict_interval(X(last, twin.feature_cols), confidence=lv)
            out['cqr'][str(lv)] = interval_metrics(y, lo, hi, lv)
            lo, hi = twin.cqr.predict_interval(X(last, twin.feature_cols), confidence=lv, adapted=True)
            out['cqr_fleet_adapted'][str(lv)] = interval_metrics(y, lo, hi, lv)
    return out


def last_cycle_predictions(twin: FittedTwin, test: pd.DataFrame, test_rul: np.ndarray) -> pd.DataFrame:
    last = last_cycle_rows(test)
    pred = twin.rul.predict(X(last, twin.feature_cols))
    frame = pd.DataFrame({
        'engine_id': last['engine_id'].values,
        'true_rul': np.minimum(test_rul, RUL_CLIP).astype(float),
        'pred': pred,
    })
    if twin.cqr is not None:
        twin.cqr.adapt_to_fleet(pred)
    for lv in CONFIDENCE_LEVELS:
        if twin.cqr is not None:
            lo, hi = twin.cqr.predict_interval(X(last, twin.feature_cols), confidence=lv, adapted=True)
        else:
            lo, hi, _ = twin.split.predict_interval(pred, confidence=lv)
        frame[f'lo_{lv}'] = np.minimum(lo, pred)
        frame[f'hi_{lv}'] = np.maximum(hi, pred)
    return frame
