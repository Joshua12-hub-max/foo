import { useState, useEffect } from 'react';
import { X, RefreshCw, Cloud, CloudOff, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Google Calendar Settings Modal
 * Configure Google Calendar synchronization
 */
const GoogleCalendarSettings = ({ show, onClose, onSync }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (show) {
      fetchSyncStatus();
    }
  }, [show]);

  const fetchSyncStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google/sync/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/google/auth', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // Open Google OAuth in new window
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      alert('Failed to connect to Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? This will remove all sync mappings.')) {
      return;
    }

    try {
      await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSyncStatus({ connected: false });
      alert('Google Calendar disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect Google Calendar');
    }
  };

  const handleSync = async (direction) => {
    setSyncing(true);
    try {
      const endpoint = direction === 'import' 
        ? '/api/google/sync/import'
        : direction === 'export'
        ? '/api/google/sync/export'
        : '/api/google/sync/bidirectional';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      alert(data.message);
      fetchSyncStatus();
      
      if (onSync) onSync();
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync with Google Calendar');
    } finally {
      setSyncing(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            Google Calendar Sync
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-[#274b46]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {syncStatus?.connected ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Connected</h3>
                        <p className="text-sm text-gray-600">
                          {syncStatus.lastSync 
                            ? `Last synced: ${new Date(syncStatus.lastSync).toLocaleString()}`
                            : 'Never synced'}
                        </p>
                        {syncStatus.syncedEventsCount > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {syncStatus.syncedEventsCount} events synced
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-6 h-6 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Not Connected</h3>
                        <p className="text-sm text-gray-600">Connect to enable sync</p>
                      </div>
                    </>
                  )}
                </div>
                
                {syncStatus?.connected ? (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-[#274b46] text-white rounded-lg hover:bg-[#1f3a36] transition-colors"
                  >
                    Connect Google Calendar
                  </button>
                )}
              </div>
            </div>

            {/* Sync Options */}
            {syncStatus?.connected && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Synchronization</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleSync('import')}
                    disabled={syncing}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#274b46] hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <div className="text-left">
                      <h4 className="font-medium text-gray-800 mb-1">Import</h4>
                      <p className="text-xs text-gray-600">
                        Get events from Google Calendar
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSync('export')}
                    disabled={syncing}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#274b46] hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <div className="text-left">
                      <h4 className="font-medium text-gray-800 mb-1">Export</h4>
                      <p className="text-xs text-gray-600">
                        Send events to Google Calendar
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSync('bidirectional')}
                    disabled={syncing}
                    className="p-4 border-2 border-[#274b46] bg-[#274b46] text-white rounded-lg hover:bg-[#1f3a36] transition-all disabled:opacity-50"
                  >
                    <div className="text-left">
                      <h4 className="font-medium mb-1">Sync Both Ways</h4>
                      <p className="text-xs opacity-90">
                        Keep everything in sync
                      </p>
                    </div>
                  </button>
                </div>

                {syncing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Syncing with Google Calendar...
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Import brings events from Google to NEBR</li>
                    <li>Export sends NEBR events to Google</li>
                    <li>Bidirectional keeps both calendars in sync</li>
                    <li>Disconnecting will remove all sync mappings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarSettings;
