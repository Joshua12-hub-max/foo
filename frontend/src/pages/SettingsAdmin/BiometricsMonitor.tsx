import MonitorHeader from '../../features/Settings/Biometrics/Monitor/components/MonitorHeader';
import MonitorStats from '../../features/Settings/Biometrics/Monitor/components/MonitorStats';
import MonitorTable from '../../features/Settings/Biometrics/Monitor/components/MonitorTable';
import { useBiometricsLogs, useDeviceStatus } from '../../features/Settings/Biometrics/Monitor/hooks/useBiometricsQuery';

export default function BiometricsMonitor() {
  const { data: logs = [], isLoading: loadingLogs } = useBiometricsLogs();
  const { data: deviceStatus } = useDeviceStatus();

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500">
      <MonitorHeader 
        lastUpdated={new Date()} 
        deviceConnected={!!deviceStatus?.connected} 
      />
      <MonitorStats logs={logs} />
      <MonitorTable logs={logs} loading={loadingLogs} />
    </div>
  );
}
