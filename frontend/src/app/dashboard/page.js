'use client';

import React from 'react';
import { useState } from 'react';
import { 
  LayoutGrid, 
  Package, 
  Store, 
  LineChart,
  Menu,
  X,
  Bell,
  User
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Package size={20} />, label: 'Inventory', href: '/inventory' },
    { icon: <Store size={20} />, label: 'Storefront', href: '/storefront' },
    { icon: <LineChart size={20} />, label: 'Accounting', href: '/accounting' },
  ];

  return (
    <div className="min-h-screen bg-green-50">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>SMB Suite</h1>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-green-100"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-100"
            >
              <span className="mr-3">{item.icon}</span>
              <span className={!isSidebarOpen ? 'hidden' : ''}>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-green-100 rounded-full">
                <Bell size={20} />
              </button>
              <button className="p-2 hover:bg-green-100 rounded-full">
                <User size={20} />
              </button>
            </div>
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