import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight, LucideIcon, Users } from 'lucide-react';

interface NavItem {
  name: string;
  icon?: LucideIcon;
  path?: string;
  action?: string;
  children?: NavItem[];
}

interface SidebarProps {
  sidebarOpen: boolean;
  navItems: NavItem[];
  handleLogout: () => void;
  onSectionChange?: (section: string) => void;
  userRole?: string;
}

export default function Sidebar({ sidebarOpen, navItems, handleLogout, onSectionChange, userRole }: SidebarProps) {
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const location = useLocation();

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const isActive = (action?: string) => {
    if (!action) return false;
    // Assuming admin dashboard root is /admin-dashboard
    if (action === 'dashboard') {
        return location.pathname === '/admin-dashboard' || location.pathname === '/admin-dashboard/';
    }
    return location.pathname.includes(action);
  };

  return (
    <aside 
      className={`bg-gradient-to-r from-slate-950 to-green-900 text-gray-100 p-4 shadow-xl mb-6 flex flex-col justify-between transition-all duration-300 z-40 min-h-screen sticky top-0 overflow-y-auto border-r border-green-900/50 ${sidebarOpen ? 'w-72' : 'w-20'}`}
      style={{
        scrollbarWidth: 'none',
        // @ts-ignore
        msOverflowStyle: 'none'
      }}
    >
      <div className="flex flex-col"> 
        <div className={`border-b border-gray-800 flex flex-col items-center justify-center flex-shrink-0 py-8 transition-all duration-300 ${
              sidebarOpen ? 'px-6' : 'px-2'}`}>
            <img src="/Logo.Municipal of Meycuayan.png" alt="Meycauayan Logo" className={`transition-all duration-300 ${sidebarOpen ? 'w-20 h-20' : 'w-12 h-12'} rounded-full flex-shrink-0 shadow-lg ring-2 ring-slate-800`}/>
             {sidebarOpen && (<div className="mt-4 text-center transition-all duration-300">
                <h1 className="text-base font-bold leading-tight tracking-wide text-white">
                  {userRole === 'Human Resource' ? 'Human Resource Portal' : 'Administrator Portal'}
                </h1>
                <p className="text-[10px] font-medium text-gray-400 leading-tight mt-1 uppercase tracking-wider">City Human Resources Management Office</p>
              </div>
            )}
        </div>

        <nav className="p-3 flex-1 mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openDropdowns[item.name];
            const active = isActive(item.action);

            const mainOnClick = () => {
              console.log('[Sidebar] Main clicked:', item.name, 'hasChildren:', hasChildren, 'action:', item.action);
              if (hasChildren) {
                // Only toggle dropdown for items with children, don't navigate
                toggleDropdown(item.name);
              } else if (item.action && onSectionChange) {
                // Only navigate for items WITHOUT children
                onSectionChange(item.action);
              }
            };

            const MainComponent = item.path ? Link : 'button';

            return (
              <div key={item.name} className="w-full">
                {/* @ts-ignore */}
                <MainComponent
                  to={item.path as string}
                  onClick={mainOnClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                    active && !hasChildren 
                    ? 'bg-slate-800/50 text-white font-semibold shadow-sm ring-1 ring-white/10' 
                    : 'text-gray-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${active && !hasChildren ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />}
                  {sidebarOpen && <span className="flex-1 text-left tracking-tight">{item.name}</span>}
                  {sidebarOpen && hasChildren && (
                    isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />
                  )}
                </MainComponent>
                {hasChildren && isOpen && sidebarOpen && (
                  <div className="ml-4 pl-3 mt-1 space-y-0.5 border-l border-gray-800">
                    {item.children?.map((child: NavItem) => {
                      const childActive = isActive(child.action);

                      const childOnClick = () => {
                        console.log('[Sidebar] Child clicked:', child.name, 'action:', child.action);
                        if (child.action && onSectionChange) {
                          onSectionChange(child.action);
                        }
                      };

                      const ChildComponent = child.path ? Link : 'button';

                      return (
                        <ChildComponent
                          key={child.name}
                          to={child.path as string}
                          onClick={childOnClick}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                            childActive 
                                ? 'bg-slate-800 text-white font-medium shadow-sm' 
                                : 'text-gray-400 hover:bg-slate-800/30 hover:text-white'
                            }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                          <span>{child.name}</span>
                        </ChildComponent>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-green-900/50 rounded-b-lg flex-shrink-0 bg-green-900/30 space-y-3">
        <Link 
          to="/employee-dashboard"
          className="w-full flex items-center justify-center gap-2 py-2.5 text-gray-300 font-semibold bg-slate-800/50 hover:bg-slate-800 rounded-md transition-all border border-slate-700 hover:border-slate-600 hover:text-white text-sm"
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && 'Switch to Employee Portal'}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[#F8F9FA] font-semibold bg-slate-950 hover:bg-slate-950/20 rounded-md transition-all border border-slate-950/10 hover:border-slate-950/20 focus:ring-2 focus:ring-slate-950/20 active:scale-95 text-sm"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
