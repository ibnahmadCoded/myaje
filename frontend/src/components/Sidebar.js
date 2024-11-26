'use client';

import React from 'react';
import { UserMenu } from '@/components/ui/usermenu';
import { 
  LayoutGrid, 
  Package, 
  Store, 
  LineChart,
  X,
  Search,
  Bell,
  NotebookIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Sidebar = ({ 
  isOpen, 
  onClose, 
  isMobile, 
  searchQuery, 
  onSearchChange,
  notifications,
  onMouseEnter,
  onMouseLeave,
  sidebarRef 
}) => {
  const menuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard', badge: '3' },
    { icon: <Package size={20} />, label: 'Inventory', href: '/inventory', badge: 'Low' },
    { icon: <Store size={20} />, label: 'Storefront', href: '/storefront' },
    { icon: <NotebookIcon size={20} />, label: 'Invoicing', href: '/invoicing' },
    { icon: <LineChart size={20} />, label: 'Accounting', href: '/accounting', badge: 'New' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-white border-r shadow-lg transition-all duration-300 w-64 z-40 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="font-bold text-xl text-green-700">Myaje Suite</h1>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X size={20} />
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              className="pl-8 bg-gray-50"
              value={searchQuery}
              onChange={onSearchChange}
            />
          </div>
        </div>

        <nav className="mt-2">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 relative"
            >
              <span className="mr-3 text-green-600">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={item.badge === 'Low' ? 'destructive' : 'default'}
                  className="ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </a>
          ))}
        </nav>

        {/* Notifications Panel */}
        <div className="absolute left-0 right-0 border-t bg-white" style={{ bottom: '5.75rem' }}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between text-gray-700 mb-2">
              <span className="text-sm font-medium">Notifications</span>
              <Badge variant="outline">{notifications.filter(n => n.isNew).length}</Badge>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-gray-50"
                >
                  <Bell size={14} className={notification.isNew ? 'text-green-500' : 'text-gray-400'} />
                  <span className="text-gray-600">{notification.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <UserMenu />
      </div>
    </>
  );
};

export default Sidebar;