import { useState, useEffect } from 'react';
import { apiBaseUrl } from '@/config';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userView, setUserView] = useState(null);

    // Fetch user_view from localStorage
    const fetchUserView = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.active_view || null;
        } catch (err) {
            console.error('Error parsing user from localStorage:', err);
            return null;
        }
    };
  
    const fetchNotifications = async () => {
      const currentUserView = fetchUserView();
        if (!currentUserView) {
            console.error('No active user found. Skipping notification fetch.');
            setNotifications([]);
            setLoading(false);
            return;
        }

        setUserView(currentUserView);

      try {
        const queryParams = new URLSearchParams({
            user_view: currentUserView,
        });

        const response = await fetch(`${apiBaseUrl}/notifications/get_notifications?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch notifications');
        
        const data = await response.json();
        setNotifications(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
  
    const markAsRead = async (notificationId) => {
      try {
        await fetch(`${apiBaseUrl}/notifications/${notificationId}/mark-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setNotifications(notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        ));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    };
  
    const markAllAsRead = async () => {
      try {
        await fetch(`${apiBaseUrl}/notifications/mark-all-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setNotifications(notifications.map(notification => ({
          ...notification,
          is_read: true
        })));
      } catch (err) {
        console.error('Error marking all as read:', err);
      }
    };
  
    useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }, []);
  
    return {
      notifications,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      refresh: fetchNotifications
    };
  };