import React, { useState } from 'react';
import Sidebar, { NavItem } from '../CustomUI/Sidebar';
import Header from '../CustomUI/Header';
import { Toaster } from 'react-hot-toast';

interface DashboardLayoutProps {
    user: any;
    navItems: NavItem[];
    onLogout: () => void;
    onSectionChange?: (section: string) => void;
    portalName: string;
    children: React.ReactNode;
    headerWidgets?: React.ReactNode;
    searchQuery?: string;
    setSearchQuery?: (query: string) => void;
    onProfileClick?: () => void;
    // Optional controlled state
    sidebarOpen?: boolean;
    setSidebarOpen?: (open: boolean) => void;
}

export default function DashboardLayout({
    user,
    navItems,
    onLogout,
    onSectionChange,
    portalName,
    children,
    headerWidgets,
    searchQuery,
    setSearchQuery,
    onProfileClick,
    sidebarOpen: controlledOpen,
    setSidebarOpen: controlledSetOpen
}: DashboardLayoutProps) {
    const [internalOpen, setInternalOpen] = useState(true);
    
    const sidebarOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setSidebarOpen = controlledSetOpen || setInternalOpen;

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
             {/* Sidebar */}
             <Sidebar 
                sidebarOpen={sidebarOpen}
                navItems={navItems}
                onLogout={onLogout}
                onSectionChange={onSectionChange}
                portalName={portalName}
             />

             {/* Main Content Wrapper */}
             <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Header 
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    user={user}
                    onProfileClick={onProfileClick}
                >
                    {headerWidgets}
                </Header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth" id="main-content">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
                        {children}
                    </div>
                </main>
             </div>
        </div>
    );
}
