'use client';

import React, { useState } from 'react';
import { Search, ShoppingCart, PackageSearch, Trash2, Star, Filter } from 'lucide-react';
import Link from 'next/link';

const MarketplaceView = () => {
  const [cartItems, setCartItems] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { 
      type: 'bot', 
      text: 'Hello! I can help you with:',
      options: [
        'Finding specific products',
        'Product recommendations',
        'Price comparisons',
        'Quality checks',
        'Seller verification',
        'Purchase advice'
      ]
    }
  ]);
  
  const addToCart = (product) => {
    setCartItems(prev => [...prev, product]);
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Column - Chat */}
      <div className="w-96 bg-white border-r hidden lg:flex flex-col">
        {/* AI Assistant Chat */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-green-50 border-b">
            <div className="flex items-center gap-2">
              <PackageSearch size={24} className="text-green-600" />
              <div>
                <h3 className="font-semibold">AI Shopping Assistant</h3>
                <p className="text-sm text-gray-600">Powered by advanced AI</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {chatMessages.map((message, index) => (
              <div key={index} className="mb-4">
                <div className={`inline-block p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-green-600 text-white ml-auto' 
                    : 'bg-gray-100'
                }`}>
                  <p>{message.text}</p>
                  {message.options && (
                    <div className="mt-2 space-y-2">
                      {message.options.map((option, i) => (
                        <button 
                          key={i}
                          className="block w-full text-left px-3 py-2 rounded bg-white text-green-600 hover:bg-green-50 text-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about products..."
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Cart Summary - Slides up from bottom */}
        <div className="border-t bg-white">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span className="font-semibold">Shopping Cart</span>
            </div>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              {cartItems.length} items
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
                <Filter size={20} />
                Filters
              </button>
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'].map((category) => (
                <button 
                  key={category}
                  className="px-4 py-1 rounded-full bg-green-50 text-green-700 hover:bg-green-100 whitespace-nowrap"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src="/api/placeholder/400/300" 
                    alt="Product" 
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-gray-50">
                    <Star size={16} className="text-gray-400" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mb-2">Product Name</h3>
                <div className="flex items-center mb-2">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">4.5 (128 reviews)</span>
                </div>
                <Link 
                  href="/store/store-name" 
                  className="text-gray-600 hover:text-green-600 hover:underline mb-2 block"
                >
                  Store Name
                </Link>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">₦15,000</span>
                  <button 
                    onClick={() => addToCart({ name: 'Product Name', price: 15000 })}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceView;