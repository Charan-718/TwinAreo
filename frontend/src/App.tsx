import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FleetView } from './components/FleetView';
import { DigitalTwinEngineView } from './components/DigitalTwinEngineView';
import { RULView } from './components/RULView';
import { FaultsView } from './components/FaultsView';
import { UncertaintyView } from './components/UncertaintyView';
import { CounterfactualSimulatorView } from './components/CounterfactualSimulatorView';
import { DriftCalibrationView } from './components/DriftCalibrationView';
import { AIAdvisorView } from './components/AIAdvisorView';

import { EngineSummary, EngineDetail } from './types';
import { fetchFleetOverview, fetchEngineDetail, triggerRecalibration } from './api';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [fleet, setFleet] = useState<EngineSummary[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState<number>(117);
  const [currentEngine, setCurrentEngine] = useState<EngineDetail | null>(null);

  const [loadingFleet, setLoadingFleet] = useState<boolean>(true);
  const [loadingEngine, setLoadingEngine] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Fleet overview statistics
  const [healthyCount, setHealthyCount] = useState<number>(0);
  const [monitorCount, setMonitorCount] = useState<number>(0);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [meanRul, setMeanRul] = useState<number>(0);

  // 1. Fetch Fleet on Mount
  useEffect(() => {
    let mounted = true;
    setLoadingFleet(true);
    fetchFleetOverview()
      .then((data) => {
        if (!mounted) return;
        setFleet(data.engines);
        setHealthyCount(data.healthy_count);
        setMonitorCount(data.monitor_count);
        setCriticalCount(data.critical_count);
        setMeanRul(data.mean_rul);

        // Check if engine 117 exists in fleet, otherwise use first
        const exists117 = data.engines.some((e) => e.engine_id === 117);
        if (!exists117 && data.engines.length > 0) {
          setSelectedEngineId(data.engines[0].engine_id);
        }
      })
      .catch((err) => console.error('Failed to fetch fleet:', err))
      .finally(() => {
        if (mounted) setLoadingFleet(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Selected Engine Detail when ID changes
  useEffect(() => {
    let mounted = true;
    setLoadingEngine(true);
    fetchEngineDetail(selectedEngineId)
      .then((data) => {
        if (mounted) setCurrentEngine(data);
      })
      .catch((err) => console.error(`Failed to fetch engine ${selectedEngineId}:`, err))
      .finally(() => {
        if (mounted) setLoadingEngine(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedEngineId]);

  // Recalibration Handler
  const handleRecalibrate = async () => {
    if (!currentEngine) return;
    setIsCalibrating(true);
    try {
      await triggerRecalibration(currentEngine.engine_id);
      // Refresh current engine state
      const refreshed = await fetchEngineDetail(currentEngine.engine_id);
      setCurrentEngine(refreshed);
    } catch (err) {
      console.error('Recalibration failed:', err);
    } finally {
      setIsCalibrating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-avionics-900 text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        currentEngine={currentEngine}
        fleet={fleet}
        selectedEngineId={selectedEngineId}
        onSelectEngine={(id) => setSelectedEngineId(id)}
        onTriggerRecalibrate={handleRecalibrate}
        isCalibrating={isCalibrating}
      />

      {/* Main Body with Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          criticalCount={criticalCount}
          monitorCount={monitorCount}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-6">
          {loadingEngine || (!currentEngine && loadingFleet) ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 font-mono text-sm space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span>Synchronizing Digital Twin telemetry stream...</span>
            </div>
          ) : currentEngine ? (
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <DashboardView engine={currentEngine} onNavigate={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'fleet' && (
                <FleetView
                  fleet={fleet}
                  selectedEngineId={selectedEngineId}
                  onSelectEngine={(id) => {
                    setSelectedEngineId(id);
                    setActiveTab('dashboard');
                  }}
                  healthyCount={healthyCount}
                  monitorCount={monitorCount}
                  criticalCount={criticalCount}
                  meanRul={meanRul}
                />
              )}
              {activeTab === 'digital-twin' && <DigitalTwinEngineView engine={currentEngine} />}
              {activeTab === 'rul' && <RULView engine={currentEngine} />}
              {activeTab === 'faults' && <FaultsView engine={currentEngine} />}
              {activeTab === 'uncertainty' && <UncertaintyView engine={currentEngine} />}
              {activeTab === 'simulation' && <CounterfactualSimulatorView engine={currentEngine} />}
              {activeTab === 'drift' && (
                <DriftCalibrationView
                  engine={currentEngine}
                  onTriggerRecalibrate={handleRecalibrate}
                  isCalibrating={isCalibrating}
                />
              )}
              {activeTab === 'advisor' && <AIAdvisorView engine={currentEngine} />}
            </div>
          ) : (
            <div className="text-center text-rose-400 font-mono py-12">
              Failed to connect to TwinAero backend. Verify that the FastAPI server is running.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
