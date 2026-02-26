import React, { useState } from 'react';
import { useBiometricDevice } from '../hooks/useBiometricDevice';

const TestBio = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev]);

  const { status, enroll, cancel } = useBiometricDevice({
    onMatch: (id, name) => addLog(`✅ MATCH MATCH: ${name} (${id})`),
    onEnrollProgress: () => addLog(`👆 Place finger again...`),
    onEnrollSuccess: () => addLog(`🎉 ENROLLMENT SUCCESS!`),
    onEnrollFail: (reason) => addLog(`❌ ENROLL FAILED: ${reason}`)
  });

  const handleTestEnroll = () => {
    addLog("Sending Enroll Command...");
    enroll("999", "Test WebSocket User", "Test Department");
  };

  return (
    <div className="p-10 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold">Biometric WebSocket Test</h1>
      
      <div className={`px-4 py-2 rounded-full font-bold ${status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        Status: {status}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={handleTestEnroll}
          disabled={status !== 'CONNECTED'}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Test Enrollment (ID 999)
        </button>
        
        <button 
          onClick={cancel}
          disabled={status !== 'CONNECTED'}
          className="px-6 py-3 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <div className="w-full max-w-md bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
         {logs.length === 0 ? <div className="text-gray-500">// Waiting for events...</div> : logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
};

export default TestBio;
