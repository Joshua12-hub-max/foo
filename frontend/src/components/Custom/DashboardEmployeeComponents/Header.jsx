import { Menu, Search, Bell, Settings } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
  return (
    <header className="bg-[#F8F9FA] border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
      {/* Sidebar toggle and Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search records..."
            className="pl-10 pr-4 py-2 rounded-md border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Notification and Settings */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-full">
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Settings className="w-5 h-5 text-slate-700" />
        </button>
      </div>
    </header>
  );
}