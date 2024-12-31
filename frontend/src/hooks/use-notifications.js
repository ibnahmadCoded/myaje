import { useState, useEffect } from 'react';
import { apiBaseUrl } from '@/config';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/notifications/get_notifications`, {
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