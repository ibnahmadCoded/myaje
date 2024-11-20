'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import Sidebar from '@/components/Sidebar';


export default function DashboardLayout ({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New order received', isNew: true },
    { id: 2, text: 'Inventory low alert', isNew: true }
  ]);

  useEffect(() => {
    const checkMobileView = () => {
      const isMobileWidth = window.innerWidth <= 768;
      setIsMobile(isMobileWidth);
      setIsSidebarOpen(!isMobileWidth);
    };

    const handleClickOutside = (event) => {
      if (isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', checkMobileView);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);

  const handleMouseEnter = () => !isMobile && setIsSidebarOpen(true);
  const handleMouseLeave = () => !isMobile && setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        notifications={notifications}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sidebarRef={sidebarRef}
      />

      {/* Hover Zone */}
      {!isMobile && (
        <div 
          className="fixed top-0 left-0 w-10 h-full z-30"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};