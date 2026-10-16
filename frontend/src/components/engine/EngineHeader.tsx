import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { ActionTag, StatusTag, Tag } from '../ui/StatusTag';
import { EngineDetail } from '../../lib/types';

export const EngineHeader: React.FC<{
  engine: EngineDetail;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ engine, title, description, actions }) => (
  <PageHeader
    eyebrow={
      <span className="font-mono font-semibold text-primary tracking-wider">
        {'[ '}{engine.unit_code}{' // TWIN_STREAM ]'}
      </span>
    }
    title={title}
    description={description}
    actions={actions}
    meta={
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <ActionTag action={engine.action_code} />
        <StatusTag status={engine.status} />
        {engine.drift_status.drift_detected && <Tag tone="info">Discrepancy</Tag>}
        <span className="text-fg-muted border-l border-line pl-2.5">
          CYCLE: {engine.total_cycles_observed} {'//'} REGIME: {engine.operating_regime} ({engine.regime_name})
        </span>
      </div>
    }
  />
);
