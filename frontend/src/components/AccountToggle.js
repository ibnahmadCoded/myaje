'use client';

import React, { useState } from 'react';
import { Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { apiBaseUrl } from '@/config';

export const AccountToggle = ({ activeView, hasBusinessAccount, onViewChange }) => {
  const [showBusinessPrompt, setShowBusinessPrompt] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleViewToggle = async (view) => {
    if (view === 'business' && !hasBusinessAccount) {
      setShowBusinessPrompt(true);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/toggle-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ view })
      });

      if (response.ok) {
        const data = await response.json();
        onViewChange(data.active_view, data.has_business_account);
      }
    } catch (error) {
      console.error('Failed to toggle view:', error);
    }
  };

  const handleBusinessSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/toggle-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          view: 'business',
          business_name: businessName
        })
      });

      if (response.ok) {
        const data = await response.json();
        onViewChange(data.active_view, data.has_business_account);
        setShowBusinessPrompt(false);
      } else {
        const error = await response.json();
        setError(error.detail);
      }
    } catch (error) {
      setError('Failed to setup business account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 p-4 border-b">
        <Button
          variant={activeView === 'personal' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => handleViewToggle('personal')}
        >
          <User className="w-4 h-4 mr-2" />
          Personal
        </Button>
        <Button
          variant={activeView === 'business' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => handleViewToggle('business')}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Business
        </Button>
      </div>

      <Dialog open={showBusinessPrompt} onOpenChange={setShowBusinessPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup Business Account</DialogTitle>
            <DialogDescription>
              Enter your business name to enable business features
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
            
            <Button 
              className="w-full"
              onClick={handleBusinessSetup}
              disabled={isLoading || !businessName.trim()}
            >
              {isLoading ? 'Setting up...' : 'Continue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountToggle;