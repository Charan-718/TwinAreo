import React, { useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Panel } from '../components/ui/Panel';

const SOURCES = [
  { name: 'NASA Open Data: C-MAPSS Aircraft Engine Simulator Data', url: 'https://data.nasa.gov/dataset/c-mapss-aircraft-engine-simulator-data', use: 'Official record; cite for provenance' },
  { name: 'Zenodo mirror: PCoE Turbofan Engine Degradation Simulation', url: 'https://zenodo.org/records/15346912', use: 'Recommended download (CMAPSSData.zip)' },
  { name: 'NASA legacy archive', url: 'https://data.nasa.gov/docs/legacy/CMAPSSData.zip', use: 'Original ZIP; may be temporarily unavailable' },
  { name: 'Kaggle mirror', url: 'https://www.kaggle.com/datasets/behrad3d/nasa-cmaps', use: 'Notebook workflows' },
];

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <Panel id={id} title={title} className="scroll-mt-20">
    <div className="prose-body text-sm">{children}</div>
  </Panel>
);

export const AboutPage: React.FC<{ anchor?: string }> = ({ anchor }) => {
  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
  }, [anchor]);

  return (
    <div className="max-w-prose">
      <PageHeader
        eyebrow="Research"
        title="Data & methods"
        description="What the twin is built on, how each component works, and where its limits are."
      />

      <nav aria-label="On this page" className="mb-6 flex flex-wrap gap-2 text-xs font-mono">
        {[['data', 'Dataset'], ['methods', 'Methods'], ['limitations', 'Limitations'], ['citation', 'Citation'], ['terms', 'Terms of use'], ['privacy', 'Privacy']].map(([id, label]) => (
          <a
            key={id}
            href={`#/about#${id}`}
            className="clip-cut-btn px-2.5 py-1 bg-surface-elevated text-primary border border-line hover:border-primary transition-colors"
          >
            [{label.toUpperCase()}]
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        <Section id="data" title="Dataset">
          <p>
            TwinAero uses the NASA C-MAPSS turbofan engine degradation simulation data from the NASA Prognostics Center of
            Excellence. The primary benchmark is FD004: multivariate sensor trajectories under six operating conditions and two
            degradation modes (high-pressure compressor and fan). Training trajectories run to failure; test trajectories stop
            before failure and come with the true remaining life.
          </p>
          <p>
            The files in this repository contain 249 training and 248 test engines for FD004. NASA's bundled readme lists the
            two counts the other way round; the numbers here are counted from the files.
          </p>
          <p>
            Channels are shown as "Sensor 1" to "Sensor 21", with the mnemonic mapping from Saxena et al. (2008) as secondary
            information. The dataset ships unlabeled columns, and its values are simulated, not measurements from a production
            engine. Sensors 1, 5, 16, 18 and 19 are constant in FD004 and carry no information.
          </p>
          <ul className="list-none p-0 mt-4 space-y-3">
            {SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer noopener">{s.name}</a>
                <span className="block text-xs text-fg-muted">{s.use}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="methods" title="Methods">
          <p><strong className="text-fg">Operating regimes.</strong> Each cycle is assigned to one of six flight conditions, and every sensor is standardized against healthy statistics for that condition, so flight-envelope changes cancel out.</p>
          <p><strong className="text-fg">Remaining life.</strong> A gradient-boosted regressor predicts RUL from normalized sensors, 10-cycle rolling statistics and operating settings. The target is capped at 125 cycles.</p>
          <p><strong className="text-fg">Uncertainty.</strong> Conformalized quantile regression with five-fold cross-conformal calibration over training engines. The served intervals are reweighted for the deployed fleet's life-stage mix using black-box shift estimation on unlabeled predictions.</p>
          <p><strong className="text-fg">Anomaly detection.</strong> Mahalanobis distance to the early-life sensor distribution, with the threshold at the 99th percentile on held-out healthy cycles.</p>
          <p><strong className="text-fg">Fault modes.</strong> Two clusters of early-to-late sensor shifts on FD004, identified using FD002, which has HPC faults only.</p>
          <p><strong className="text-fg">Twin discrepancy.</strong> Kolmogorov-Smirnov tests between the last 15 cycles and training cycles at the same predicted life stage, with a threshold calibrated on held-out engines.</p>
          <p><strong className="text-fg">What-if scenarios.</strong> A parametric stress surrogate relative to the engine's current operating point.</p>
          <p><strong className="text-fg">Advisor.</strong> A deterministic sequence of agents that decides on the conservative interval bound.</p>
        </Section>

        <Section id="limitations" title="Limitations">
          <p>All data is simulated. Results on C-MAPSS do not establish performance on real engines.</p>
          <p>C-MAPSS publishes no per-engine fault labels, so fault-mode results are hypotheses, validated only indirectly on subsets with known fault content.</p>
          <p>In C-MAPSS, operating settings do not drive the damage process, so what-if effect sizes cannot be validated. Only their direction and internal consistency are tested.</p>
          <p>Coverage guarantees are marginal and assume the deployed fleet resembles the calibration engines. Under a new fault mode they fail until new failures are used to recalibrate, as the transfer experiment shows.</p>
        </Section>

        <Section id="citation" title="Citation">
          <p>A. Saxena, K. Goebel, D. Simon and N. Eklund, "Damage Propagation Modeling for Aircraft Engine Run-to-Failure Simulation," Proceedings of the 1st International Conference on Prognostics and Health Management (PHM08), Denver, CO, 2008.</p>
        </Section>

        <Section id="terms" title="Terms of use">
          <p>
            TwinAero is a research prototype provided as is, without warranty of any kind. It operates on simulated data and its
            outputs are not airworthiness determinations, maintenance instructions or certified engineering advice. Do not use it
            to make operational decisions about real aircraft or engines.
          </p>
          <p>
            The C-MAPSS data remains subject to the terms of its publisher, NASA.
          </p>
        </Section>

        <Section id="privacy" title="Privacy">
          <p>
            TwinAero collects no personal data. It has no accounts, analytics or tracking, and makes no requests to third-party
            services; fonts are bundled with the application. The only browser storage is your theme choice, saved locally on your
            device. Calibration checks you run are kept in the server's memory for the current session and cleared on restart.
          </p>
        </Section>
      </div>
    </div>
  );
};
