import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, ChevronUp } from 'lucide-react';
import { apiBaseUrl } from '@/config';

export const UserMenu = () => {
  const [isDropupOpen, setIsDropupOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure this runs only on the client side
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUserDetails(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user'); // Clear invalid data
        }
      }
    }
  }, []);
  
  const handleLogout = async (e) => {
    e.preventDefault();
  
    if (typeof window === 'undefined') {
      console.error('Logout attempted in an environment without `window`.');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        localStorage.removeItem('token');
        router.push('/admin/login'); // Redirect to login
      } else {
        const data = await response.json();
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
                  <div className="text-sm font-medium text-stone-800">Loading...</div> 
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
