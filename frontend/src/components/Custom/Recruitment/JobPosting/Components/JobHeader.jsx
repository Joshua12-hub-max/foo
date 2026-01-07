import { RefreshCw, Mail, Share2, Plus } from 'lucide-react';

const JobHeader = ({ checkingEmails, onCheckEmails, onApiSetup, onCreateJob }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Job Posting
        </h2>
        <p className="text-sm text-gray-600 mt-1">Create and manage job postings</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onCheckEmails}
          disabled={checkingEmails}
          className="bg-white text-gray-700 border border-gray-200 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
          title="Check for applications sent via email"
        >
          {checkingEmails ? (
            <RefreshCw size={18} className="text-blue-600 animate-spin" />
          ) : (
            <Mail size={18} className="text-blue-600" />
          )}
          {checkingEmails ? 'Checking...' : 'Check Emails'}
        </button>
        <button 
          onClick={onApiSetup}
          className="bg-white text-gray-700 border border-gray-200 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
          title="Configure External Integrations"
        >
          <Share2 size={18} className="text-blue-600" /> API Setup
        </button>
        <button 
          onClick={onCreateJob}
          className="bg-gray-200 text-gray-800 border border-gray-200 font-medium px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-300 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Create a Job
        </button>
      </div>
    </div>
  );
};

export default JobHeader;
