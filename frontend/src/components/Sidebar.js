'use client';

import React, { useState } from 'react';
import { UserMenu } from '@/components/ui/userMenu';
import { 
  LayoutGrid, 
  Package, 
  Store, 
  X,
  Bell,
  NotebookIcon,
  PackageOpen,
  BanknoteIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
//import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AccountToggle } from '@/components/AccountToggle'

const Sidebar = ({ 
  isOpen, 
  onClose, 
  isMobile, 
  searchQuery, 
  onSearchChange,
  notifications = [],
  loading = false,
  onNotificationClick,
  onMarkAllRead,
  onMouseEnter,
  onMouseLeave,
  sidebarRef 
}) => {
  const [activeView, setActiveView] = useState('personal');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setActiveView(user.active_view || 'personal');
    }
  }, []);

  //const [hasBusinessAccount, setHasBusinessAccount] = useState(() => {
  //  const user = JSON.parse(localStorage.getItem('user') || '{}');
  //  return user.has_business_account || false;
  //});

  let user = {};
  let hasBusinessAccount = false;

  if (typeof window !== 'undefined') {
    user = JSON.parse(localStorage.getItem('user') || '{}');
    hasBusinessAccount = user.has_business_account || false;
  }

  if(searchQuery){
    //console.log("")
  }

  if (onSearchChange){
    //console.log("")
  }

  const personalRoutes = ['/dashboard', '/banking', '/my-items'];
  const businessRoutes = ['/dashboard', '/banking', '/inventory', '/storefront', '/invoicing', '/restock'];

  const handleViewChange = (newView, newHasBusinessAccount) => {
    setActiveView(newView);

    if (typeof window === 'undefined') return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...user, active_view: newView, has_business_account: newHasBusinessAccount }));
  
    // Ensure we're in the browser (client-side) before accessing window
    if (typeof window !== 'undefined') {
      // Get current route
      const currentRoute = window.location.pathname;
  
      // Check if route exists in new view
      const routesForNewView = newView === 'personal' ? personalRoutes : businessRoutes;
      const routeExists = routesForNewView.includes(currentRoute);
  
      // Redirect to same route if it exists, otherwise to dashboard
      window.location.href = routeExists ? currentRoute : '/dashboard';
    }
  };

  // Separate menu items for different views
  const personalMenuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Package size={20} />, label: 'My Items', href: '/my-items' }, // Added My Items (3 tabs: Purchased Items, Saved Items, Reviewed Items)
    //{ icon: <LineChart size={20} />, label: 'Banking', href: '/banking', badge: 'BAM' }, Banking is hiddem for now
  ];
  

  const businessMenuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard'},
    { icon: <Package size={20} />, label: 'Inventory', href: '/inventory'},
    { icon: <Store size={20} />, label: 'Storefront', href: '/storefront' },
    { icon: <NotebookIcon size={20} />, label: 'Invoicing', href: '/invoicing' },
    { icon: <PackageOpen size={20} />, label: 'Restock', href: '/restock' },
    { icon: <BanknoteIcon size={20} />, label: 'Payouts', href: '/payouts' },
    //{ icon: <LineChart size={20} />, label: 'Banking', href: '/banking', badge: 'BAM' }, Banking is hiddem for now
  ];

  const currentMenuItems = activeView === 'personal' ? personalMenuItems : businessMenuItems;

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        <h1 
          className="font-bold text-xl text-green-700 cursor-pointer"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard';
            }
          }}
        >
          Myaje
        </h1>
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

        <AccountToggle 
          activeView={activeView}
          hasBusinessAccount={hasBusinessAccount}
          onViewChange={handleViewChange}
        />

        {/* Navigation Menu */}
        <nav className="mt-2">
          {currentMenuItems.map((item, index) => (
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
              {unreadCount > 0 && (
                <div className="flex gap-2 items-center">
                  <Badge variant="outline">{unreadCount}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-green-600 hover:text-green-700"
                    onClick={onMarkAllRead}
                  >
                    Mark all read
                  </Button>
                </div>
              )}
            </div>
            
            <ScrollArea className="max-h-64">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No notifications</div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      onClick={() => {
                        // Ensure the code runs only on the client (browser)
                        if (typeof window !== 'undefined') {
                          if (notification.type === 'new_order') {
                            window.location.href = '/storefront';
                          } else if (notification.type === 'new_invoice') {
                            window.location.href = '/invoicing';
                          }
                        }
                    
                        // Always call this function, regardless of the window check
                        onNotificationClick(notification.id); 
                      }}
                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer
                        ${!notification.is_read ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}`}
                    >
                      <Bell 
                        size={14} 
                        className={!notification.is_read ? 'text-green-500 mt-1' : 'text-gray-400 mt-1'} 
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''} text-gray-600`}>
                          {notification.text}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <UserMenu />
      </div>
    </>
  );
};

export default Sidebar;