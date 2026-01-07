import { X, Send } from 'lucide-react';

const ShareJobModal = ({ isOpen, onClose, selectedJob, handlePostToTelegram, handlePostToLinkedIn, saving }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {selectedJob ? 'Share Job Posting' : 'Platform Configuration'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {selectedJob ? (
            <div className="space-y-5">
              {/* Job Info Card */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">Selected Job</p>
                <p className="font-bold text-gray-900 text-lg leading-tight">{selectedJob.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{selectedJob.department}</p>
              </div>

              {/* Post to Telegram Button */}
              <button 
                onClick={handlePostToTelegram}
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b5] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold">Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Post to Telegram</span>
                  </>
                )}
              </button>

              {/* Post to LinkedIn Button */}
              <button 
                onClick={handlePostToLinkedIn}
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold">Posting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="font-bold">Share on LinkedIn</span>
                  </>
                )}
              </button>

              {/* Info Text */}
              <p className="text-xs text-gray-400 text-center px-4">
                Posts will be sent to your configured Telegram channel or Discord server.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <h3 className="font-bold text-gray-800 text-sm mb-2">Configuration Required</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Add these to your system environment (.env):
                </p>
                
                {/* Telegram Config */}
                <p className="text-xs font-semibold text-gray-700 mb-1">Telegram:</p>
                <ul className="text-xs text-gray-600 space-y-1.5 mb-3">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#0088cc] rounded-full flex-shrink-0"></span>
                    <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-mono">TELEGRAM_BOT_TOKEN</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#0088cc] rounded-full flex-shrink-0"></span>
                    <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-mono">TELEGRAM_CHANNEL_ID</code>
                  </li>
                </ul>

                {/* LinkedIn Config */}
                <p className="text-xs font-semibold text-gray-700 mb-1">LinkedIn:</p>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#0A66C2] rounded-full flex-shrink-0"></span>
                    <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-mono">LINKEDIN_CLIENT_ID</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#0A66C2] rounded-full flex-shrink-0"></span>
                    <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-mono">LINKEDIN_CLIENT_SECRET</code>
                  </li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">
                  First-time use will prompt LinkedIn authorization.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareJobModal;
