import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, ChevronUp } from 'lucide-react';

export const UserMenu = () => {
  const [isDropupOpen, setIsDropupOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUserDetails(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('token');
        router.push('/admin/login');
      } else {
        console.error('Logout failed:', data);
      }
    } catch (error) {
      console.error('An error occurred during logout:', error);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-amber-50 hover:bg-amber-100">
      <div className="relative">
        {/* Dropup menu */}
        {isDropupOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-amber-50 border rounded-md shadow-lg">
            <div 
              className="flex items-center p-2 hover:bg-amber-100 cursor-pointer text-stone-700 text-sm"
              onClick={() => {/* Handle profile */}}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </div>
            <div 
              className="flex items-center p-2 hover:bg-amber-100 cursor-pointer text-stone-700 text-sm"
              onClick={() => {/* Handle settings */}}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </div>
            <div 
              className="flex items-center p-2 hover:bg-red-50 hover:text-red-600 cursor-pointer text-stone-700 text-sm"
              onClick={handleLogout}  // Call the logout function on click
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </div>
          </div>
        )}
        
        {/* User info and dropup toggle */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsDropupOpen(!isDropupOpen)}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-stone-200 rounded-full mr-3 flex items-center justify-center">
              <User className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              {userDetails ? (  // Only render user details if userDetails is available
                  <>
                    <div className="text-sm font-medium text-stone-800">{`${userDetails.first_name || ''} ${userDetails.last_name || ''}`}</div>
                    <div className="text-xs text-stone-500">{userDetails.email}</div>
                  </>
                ) : (
                  <div className="text-sm font-medium text-stone-800">Loading...</div> // Loading state
                )}
            </div>
          </div>
          
          <ChevronUp 
            className={`w-5 h-5 text-stone-500 transition-transform ${isDropupOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>
    </div>
  );
};
