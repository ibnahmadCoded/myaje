'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';


export default function DashboardLayout ({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      text: 'New order received #1045', 
      isNew: true,
      timestamp: Date.now() - 5000 // slightly older
    },
    { 
      id: 2, 
      text: 'Inventory low alert: Coffee Beans', 
      isNew: true,
      timestamp: Date.now() - 3000 
    },
    { 
      id: 3, 
      text: 'Payment processed for invoice #254', 
      isNew: true,
      timestamp: Date.now() - 7000
    },
    { 
      id: 4, 
      text: 'Customer support ticket #89 updated', 
      isNew: true,
      timestamp: Date.now() - 2000
    },
    { 
      id: 5, 
      text: 'New product review received', 
      isNew: true,
      timestamp: Date.now() - 4000
    },
    { 
      id: 6, 
      text: 'Monthly sales report ready', 
      isNew: true,
      timestamp: Date.now() - 8000
    },
    { 
      id: 7, 
      text: 'Shipping delay detected for order #1042', 
      isNew: false,
      timestamp: Date.now() - 24000
    },
    { 
      id: 8, 
      text: 'Refund processed for customer', 
      isNew: false,
      timestamp: Date.now() - 36000
    },
    { 
      id: 9, 
      text: 'New supplier contract signed', 
      isNew: false,
      timestamp: Date.now() - 48000
    },
    { 
      id: 10, 
      text: 'Quarterly inventory audit completed', 
      isNew: false,
      timestamp: Date.now() - 72000
    }
  ]);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
    // Check authentication on component mount
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if no token
      router.push('/login');
    } else {
      // Optional: Validate token with backend
      validateToken(token);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await fetch('http://localhost:8000/auth/validate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Token invalid, redirect to login
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Token validation failed');
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  // Rest of your existing DashboardLayout code...
  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

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

        
        {/* Top Navigation */}
          <div className="flex items-center justify-between px-6 py-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu size={20} />
              </Button>
            )}
          </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};