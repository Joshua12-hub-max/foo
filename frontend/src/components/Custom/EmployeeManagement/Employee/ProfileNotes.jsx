import React from 'react';
import { MessageSquare } from 'lucide-react';

const ProfileNotes = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center py-12">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
        <MessageSquare size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">Notes & Comments</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        This feature is coming soon. You will be able to add private administrative notes and comments about the employee here.
      </p>
    </div>
  );
};

export default ProfileNotes;
