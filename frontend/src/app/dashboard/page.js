'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserMenu } from '@/components/ui/usermenu';
import { 
  LayoutGrid, 
  Package, 
  Store, 
  LineChart,
  Menu,
  Bell,
  User
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Detect mobile view
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      const isMobileWidth = window.innerWidth <= 768;
      setIsMobile(isMobileWidth);
      
      // On mobile, sidebar is closed by default
      // On desktop, sidebar remains closed
      if (isMobileWidth) {
        setIsSidebarOpen(false);
      }
    };

    // Check initial screen size
    checkMobileView();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobileView);

    // Cleanup event listener
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const menuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Package size={20} />, label: 'Inventory', href: '/inventory' },
    { icon: <Store size={20} />, label: 'Storefront', href: '/storefront' },
    { icon: <LineChart size={20} />, label: 'Accounting', href: '/accounting' },
  ];

  // Hover logic for desktop
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Determine sidebar visibility and width
  const sidebarVisibility = isSidebarOpen 
    ? 'translate-x-0' 
    : '-translate-x-full';

  return (
    <div className="min-h-screen bg-green-50">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-green-50/40 shadow-lg transition-transform duration-300 w-64 z-40 ease-in-out ${sidebarVisibility}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-xl">Myaje Suite</h1>
        </div>

        <nav className="mt-8">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-amber-100"
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Notifications */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-gray-700">
            <span className="text-sm font-medium">Notifications</span>
            <button className="p-2 hover:bg-green-100 rounded-full">
              <Bell size={20} />
            </button>
          </div>
        </div>

        <UserMenu />
      </div>

      {/* Main Content Area with Hover Zone */}
      <div 
        className={`fixed top-0 left-0 w-10 h-full z-30`}
        onMouseEnter={handleMouseEnter}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Navigation */}
        <header className="bg-green-50">
          <div className="flex items-center justify-between px-6 py-4">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-green-100"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;