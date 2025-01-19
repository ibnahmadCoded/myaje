'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import MarketplaceView from '@/components/Marketplace';
import BusinessFeatures from '@/components/BusinessFeatures';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/logo'
import { useCart } from '@/app/providers/cart-provider';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [showChat, setShowChat] = useState(false);

  const router = useRouter();
  const { cartItems } = useCart();

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
      
    if (userDataStr && token) {
      try {
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error in initialization:", error);
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Persistent Header */}
      <header className="sticky top-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div onClick={() => router.push('/')} className="cursor-pointer">
              <Logo />
            </div>
            
            <div className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('marketplace')}
                className={`${activeTab === 'marketplace' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'} px-3 py-4`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setActiveTab('business')}
                className={`${activeTab === 'business' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'} px-3 py-4`}
              >
                For Business
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {activeTab === 'marketplace' && (
                <button className="p-2 text-gray-600 hover:text-green-600 relative">
                  <ShoppingCart size={20} />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              )}
              
              {isAuthenticated ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'marketplace' ? (
          <MarketplaceView showMobileChat={showChat} onCloseMobileChat={() => setShowChat(false)} />
        ) : (
          <BusinessFeatures />
        )}
      </main>

      {/* Floating Chat Button (Mobile) */}
      {activeTab === 'marketplace' && (
        <button
          onClick={() => setShowChat(prev => !prev)}
          className="fixed bottom-4 right-4 lg:hidden bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}