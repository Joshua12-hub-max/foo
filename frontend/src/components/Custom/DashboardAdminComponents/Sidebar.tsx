import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight, LucideIcon, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  name: string;
  icon?: LucideIcon;
  path?: string;
  action?: string;
  count?: number;
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setPortalView = useAuthStore((state) => state.setPortalView);

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

  const handleSwitchToEmployeePortal = (e: React.MouseEvent) => {
    e.preventDefault();
    // 100% SUCCESS: Set portal view to employee to filter data to self only
    setPortalView(true);
    // Clear all cached queries to prevent showing admin data in employee portal
    queryClient.invalidateQueries();
    navigate('/employee-dashboard');
  };

  return (
    <aside 
      className={`bg-[var(--zed-bg-surface)] text-[var(--zed-text-dark)] shadow-[var(--zed-shadow-sm)] flex flex-col justify-between transition-all duration-300 z-40 min-h-screen sticky top-0 overflow-y-auto border-r border-[var(--zed-border-light)] ${sidebarOpen ? 'w-72' : 'w-20'}`}
      style={{
        scrollbarWidth: 'none',
      }}
    >
      <div className="flex flex-col"> 
        <div className={`border-b border-[var(--zed-border-light)] flex flex-col items-center justify-center flex-shrink-0 py-8 transition-all duration-300 ${
              sidebarOpen ? 'px-6' : 'px-2'}`}>
            <img 
              src="/Logo.Municipal of Meycuayan.png" 
              alt="Meycauayan Logo" 
              className={`transition-all duration-300 object-contain drop-shadow-sm ${sidebarOpen ? 'w-20 h-20' : 'w-12 h-12'}`}
            />
             {sidebarOpen && (<div className="mt-5 text-center transition-all duration-300">
                <h1 className="text-sm font-black tracking-tight text-[var(--zed-text-dark)] leading-tight">
                  {userRole === 'Human Resource' ? 'Human Resource Portal' : 'Administrator Portal'}
                </h1>
                <p className="text-[10px] font-black text-[var(--zed-text-muted)] mt-1.5 tracking-widest leading-tight">City Human Resource Management Officer</p>
              </div>
            )}
        </div>

        <nav className="p-4 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openDropdowns[item.name];
            const active = isActive(item.action);

            const mainOnClick = () => {
              if (hasChildren) {
                toggleDropdown(item.name);
              } else if (item.action && onSectionChange) {
                onSectionChange(item.action);
              }
            };

            const MainComponent = (item.path ? Link : 'button') as React.ElementType;

            return (
              <div key={item.name} className="w-full">
                <MainComponent
                  {...(item.path ? { to: item.path } : {})}
                  onClick={mainOnClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-all duration-200 group relative tracking-tight ${
                    active && !hasChildren 
                    ? 'bg-[var(--zed-accent)] text-white font-black shadow-md' 
                    : 'text-[var(--zed-text-muted)] hover:bg-white hover:text-[var(--zed-text-dark)] font-bold border border-transparent hover:border-[var(--zed-border-light)]'
                  }`}
                >
                  {Icon && <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${active && !hasChildren ? 'text-white' : 'text-[var(--zed-text-muted)] group-hover:text-[var(--zed-accent)] font-black'}`} />}
                  {sidebarOpen && <span className="flex-1 text-left">{item.name}</span>}
                  
                  {/* Badge for both open and closed sidebar */}
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`bg-red-500 text-white font-black rounded-[var(--radius-sm)] text-center transition-all shadow-sm ${
                        sidebarOpen 
                        ? 'text-[10px] px-1.5 py-0.5 min-w-[20px]' 
                        : 'absolute top-0 right-0 w-2.5 h-2.5 text-[0px] ring-2 ring-[var(--zed-bg-surface)]'
                    }`}>
                      {sidebarOpen ? (item.count > 99 ? '99+' : item.count) : ''}
                    </span>
                  )}

                  {sidebarOpen && hasChildren && (
                    isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />
                  )}
                </MainComponent>
                
                {hasChildren && isOpen && sidebarOpen && (
                  <div className="ml-5 pl-3 mt-1.5 mb-2 space-y-1 border-l border-[var(--zed-border-light)]">
                    {item.children?.map((child: NavItem) => {
                      const childActive = isActive(child.action);

                      const childOnClick = () => {
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
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-xs transition-all duration-200 tracking-tight ${
                            childActive 
                                ? 'bg-white text-[var(--zed-text-dark)] font-black shadow-sm border border-[var(--zed-border-light)]' 
                                : 'text-[var(--zed-text-muted)] hover:bg-white hover:text-[var(--zed-text-dark)] font-bold'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${childActive ? 'bg-[var(--zed-accent)]' : 'bg-[var(--zed-border-light)]'}`}></span>
                          <span>{child.name}</span>
                          {child.count !== undefined && child.count > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-[var(--radius-sm)] ml-auto">
                              {child.count > 99 ? '99+' : child.count}
                            </span>
                          )}
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

      <div className="p-4 border-t border-[var(--zed-border-light)] flex-shrink-0 bg-gray-50/50 space-y-3">
        <button
          onClick={handleSwitchToEmployeePortal}
          className="w-full flex items-center justify-center gap-2 py-3 text-[var(--zed-accent)] font-black bg-white hover:bg-[var(--zed-accent)] hover:text-white rounded-[var(--radius-sm)] transition-all border border-[var(--zed-accent)] text-xs tracking-wider shadow-sm group"
        >
          <Users className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
          {sidebarOpen && 'Switch to Employee Portal'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-white font-black bg-red-600 hover:bg-red-700 rounded-[var(--radius-sm)] transition-all shadow-sm active:scale-95 text-xs tracking-wider"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
