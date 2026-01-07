import { 
  MonitorHeader, 
  MonitorStats, 
  MonitorTable, 
  useBiometricsMonitor 
} from '@components/Custom/Settings/Biometrics/Monitor';

export default function BiometricsMonitor() {
  const { logs, loading, lastUpdated } = useBiometricsMonitor();

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500">
      <MonitorHeader lastUpdated={lastUpdated} />
      <MonitorStats logs={logs} />
      <MonitorTable logs={logs} loading={loading} />
    </div>
  );
}
