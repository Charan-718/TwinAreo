import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { ActionTag, StatusTag, Tag } from '../ui/StatusTag';
import { EngineDetail } from '../../lib/types';

export const EngineHeader: React.FC<{ engine: EngineDetail; title: string; description?: React.ReactNode; actions?: React.ReactNode }> = ({
  engine, title, description, actions,
}) => (
  <PageHeader
    eyebrow={<span className="font-mono">{engine.unit_code}</span>}
    title={title}
    description={description}
    actions={actions}
    meta={
      <>
        <ActionTag action={engine.action_code} />
        <StatusTag status={engine.status} />
        {engine.drift_status.drift_detected && <Tag tone="info">Twin discrepancy</Tag>}
        <span className="text-sm text-fg-muted">
          Cycle {engine.total_cycles_observed} · Regime {engine.operating_regime} ({engine.regime_name})
        </span>
      </>
    }
  />
);
