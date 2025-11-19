import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight } from 'lucide-react';

export default function Sidebar({ sidebarOpen, navItems, handleLogout, onSectionChange }) {
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (name) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <aside className={`scrollbar-green-950 bg-[#274b46] text-[#F8F9FA] p-4 shadow-sm p-4 shadow-sm mb-6 flex flex-col justify-between shadow-lg transition-all duration-300 z-40 min-h-screen sticky top-0 overflow-y-auto ${sidebarOpen ? 'w-70' : 'w-30'}`}>
      <div className="flex flex-col">
        <div className={`border-b border-[#F8F9FA] flex flex-col items-center justify-center flex-shrink-0 py-6 transition-all duration-300 ${
              sidebarOpen ? 'px-6' : 'px-2'}`}>
            <img src="/Logo.Municipal of Meycuayan.png" alt="Meycauayan Logo" className={`transition-all duration-300 ${sidebarOpen ? 'w-20 h-20' : 'w-16 h-16'} rounded-full flex-shrink-0 hover:scale-105`}/>
             {sidebarOpen && (<div className="mt-3 text-center transition-all duration-300">
                <h1 className="text-lg font-bold leading-tight">Administrator Portal</h1>
                <p className="text-xs text-[#F8F9FA] leading-tight mb-2"> City Human Resources Management Office</p>
              </div>
            )}
        </div>

        <nav className="p-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openDropdowns[item.name];

            const mainOnClick = () => {
              if (hasChildren) {
                toggleDropdown(item.name);
              }
              if (item.action && onSectionChange) {
                onSectionChange(item.action);
              }
            };

            const MainComponent = item.path ? Link : 'button';

            return (
              <div key={item.name} className="w-full">
                <MainComponent
                  to={item.path}
                  onClick={mainOnClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-[#34645c] transition-colors"
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="flex-1 text-left">{item.name}</span>}
                  {sidebarOpen && hasChildren && (
                    isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  )}
                </MainComponent>
                {hasChildren && isOpen && sidebarOpen && (
                  <div className="ml-8 mt-1 space-y-1 relative w-full">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-white"></div>
                    {item.children.map((child) => {
                      const childOnClick = () => {
                        if (child.action && onSectionChange) {
                          onSectionChange(child.action);
                        }
                      };

                      const ChildComponent = child.path ? Link : 'button';

                      return (
                        <ChildComponent
                          key={child.name}
                          to={child.path}
                          onClick={childOnClick}
                          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-[#34645c] transition-colors text-slate-300"
                        >
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

      <div className="p-4 border-t border-[#305d56] flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-[#F8F9FA] font-semibold bg-[#305d56] rounded-md shadow-md "
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && 'Logout'}
        </button>
      </div>
    </aside>
  );
}