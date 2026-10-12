import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { EngineLoader } from './components/engine/EngineLoader';
import { ErrorState, PageSkeleton } from './components/ui/Feedback';
import { api } from './lib/api';
import { useRoute } from './lib/router';
import { useAsync } from './lib/useAsync';
import { FleetPage } from './pages/FleetPage';
import { OverviewPage } from './pages/OverviewPage';
import { TwinStatePage } from './pages/TwinStatePage';
import { PrognosisPage } from './pages/PrognosisPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { DriftPage } from './pages/DriftPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { AdvisorPage } from './pages/AdvisorPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { AboutPage } from './pages/AboutPage';

const TITLES: Record<string, string> = {
  fleet: 'Fleet status', evaluation: 'Evaluation', about: 'Data & methods', overview: 'Overview', twin: 'Twin state',
  prognosis: 'Prognosis', diagnostics: 'Diagnostics', drift: 'Drift & calibration', scenarios: 'What-if scenarios',
  advisor: 'Maintenance advisor',
};

export const App: React.FC = () => {
  const route = useRoute();
  const fleet = useAsync(() => api.fleet(), []);
  const [lastEngine, setLastEngine] = useState<number | null>(null);
  const [engineVersion, setEngineVersion] = useState(0);

  // Default engine: the one whose conservative RUL bound is lowest (highest maintenance priority).
  const priorityEngine = useMemo(() => {
    const engines = fleet.data?.engines;
    if (!engines?.length) return null;
    return [...engines].sort((a, b) => a.rul_lower - b.rul_lower || a.engine_id - b.engine_id)[0].engine_id;
  }, [fleet.data]);

  useEffect(() => {
    if (route.kind === 'engine') setLastEngine(route.engineId);
  }, [route]);

  const engineId = route.kind === 'engine' ? route.engineId : lastEngine ?? priorityEngine;

  useEffect(() => {
    const unit = route.kind === 'engine' ? ` · FD004-${String(route.engineId).padStart(3, '0')}` : '';
    document.title = `${TITLES[route.page]}${unit} · TwinAero`;
  }, [route]);

  let content: React.ReactNode;
  if (route.kind === 'global') {
    if (route.page === 'fleet') {
      content = fleet.error ? (
        <ErrorState title="Could not load the fleet" error={fleet.error} onRetry={fleet.reload} />
      ) : fleet.loading || !fleet.data ? (
        <PageSkeleton label="Loading fleet" />
      ) : (
        <FleetPage fleet={fleet.data} />
      );
    } else if (route.page === 'evaluation') {
      content = <EvaluationPage />;
    } else {
      content = <AboutPage anchor={route.anchor} />;
    }
  } else {
    const onRecalibrated = () => setEngineVersion((v) => v + 1);
    content = (
      <EngineLoader key={route.engineId} engineId={route.engineId} version={engineVersion}>
        {(engine) => {
          switch (route.page) {
            case 'twin': return <TwinStatePage engine={engine} />;
            case 'prognosis': return <PrognosisPage engine={engine} />;
            case 'diagnostics': return <DiagnosticsPage engine={engine} />;
            case 'drift': return <DriftPage engine={engine} onRecalibrated={onRecalibrated} />;
            case 'scenarios': return <ScenariosPage engine={engine} />;
            case 'advisor': return <AdvisorPage engine={engine} />;
            default: return <OverviewPage engine={engine} />;
          }
        }}
      </EngineLoader>
    );
  }

  return (
    <AppShell route={route} engineId={engineId} fleet={fleet.data?.engines ?? null}>
      {content}
    </AppShell>
  );
};

export default App;
