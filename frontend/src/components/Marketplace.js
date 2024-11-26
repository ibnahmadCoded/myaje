import React, { useState } from 'react';
import { Search, ShoppingCart, PackageSearch, Trash2, Star, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CheckoutDialog } from '@/components/CheckoutDialog'
import { CartDialog } from '@/components/CartDialog'

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    price: 15000,
    rating: 4.5,
    reviews: 128,
    store: "TechHub",
    category: "Electronics",
  },
  {
    id: 2,
    name: "Premium Cotton T-Shirt",
    price: 5000,
    rating: 4.2,
    reviews: 89,
    store: "FashionCore",
    category: "Fashion",
  },
  {
    id: 3,
    name: "Smart Home Security Camera",
    price: 25000,
    rating: 4.8,
    reviews: 256,
    store: "SmartLife",
    category: "Electronics",
  },
  {
    id: 4,
    name: "Comfortable Running Shoes",
    price: 12000,
    rating: 4.3,
    reviews: 152,
    store: "Sportify",
    category: "Sports",
  },
  {
    id: 5,
    name: "Organic Skincare Set",
    price: 20000,
    rating: 4.7,
    reviews: 110,
    store: "BeautyNest",
    category: "Beauty",
  },
  {
    id: 6,
    name: "Classic Wooden Dining Chair",
    price: 18000,
    rating: 4.1,
    reviews: 74,
    store: "HomeComfort",
    category: "Home",
  },
  {
    id: 7,
    name: "Bluetooth Smartwatch",
    price: 30000,
    rating: 4.6,
    reviews: 192,
    store: "TechHub",
    category: "Electronics",
  },
  {
    id: 8,
    name: "Formal Leather Belt",
    price: 7000,
    rating: 4.4,
    reviews: 65,
    store: "FashionCore",
    category: "Fashion",
  },
  {
    id: 9,
    name: "Professional Yoga Mat",
    price: 10000,
    rating: 4.5,
    reviews: 132,
    store: "Sportify",
    category: "Sports",
  },
  {
    id: 10,
    name: "Aromatherapy Candle Set",
    price: 15000,
    rating: 4.9,
    reviews: 98,
    store: "BeautyNest",
    category: "Beauty",
  },
];

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

// Hero Section SVG
const ProductPlaceholder = () => (
  <svg viewBox="0 0 600 400" className="w-full h-full rounded-2xl transform hover:scale-105 transition-transform duration-300">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#34D399', stopOpacity: 0.2 }} />
        <stop offset="100%" style={{ stopColor: '#FCD34D', stopOpacity: 0.2 }} />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="600" height="400" fill="url(#grad1)" rx="20" />
    <circle cx="300" cy="200" r="80" fill="#34D399" fillOpacity="0.3" />
    <path d="M250 180 Q300 120 350 180 T450 180" stroke="#059669" strokeWidth="4" fill="none" />
    <rect x="150" y="250" width="300" height="40" fill="#059669" fillOpacity="0.1" rx="8" />
    <rect x="150" y="300" width="200" height="40" fill="#059669" fillOpacity="0.1" rx="8" />
  </svg>
);

const MarketplaceView = () => {
  const [cartItems, setCartItems] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
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

const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

const updateQuantity = (cartId, newQuantity) => {
  if (newQuantity < 1) return;
  setCartItems(prev => prev.map(item => 
    item.cartId === cartId ? { ...item, quantity: newQuantity } : item
  ));
};

const handleCheckoutComplete = () => {
  setCartItems([]);
  setIsCartOpen(false);
  setIsCheckoutOpen(false);
};

  const addToCart = (product) => {
    setCartItems(prev => [...prev, { 
      ...product, 
      cartId: Date.now(),
      quantity: 1  // Add default quantity
    }]);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, { type: 'user', text: chatInput }]);
    setChatInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: "I'll help you find what you're looking for. Could you provide more details about what you're interested in?"
      }]);
      setIsLoading(false);
    }, 1000);
  };

  const filteredProducts = SAMPLE_PRODUCTS.filter(product => 
    selectedCategory === 'All' || product.category === selectedCategory
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Column - Chat */}
      <div className="w-96 bg-white border-r hidden lg:flex flex-col">
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

          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            role="log"
            aria-live="polite"
          >
            {chatMessages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100'
                }`}>
                  <p>{message.text}</p>
                  {message.options && (
                    <div className="mt-2 space-y-2">
                      {message.options.map((option, i) => (
                        <button 
                          key={i}
                          className="block w-full text-left px-3 py-2 rounded bg-white text-green-600 hover:bg-green-50 text-sm transition-colors"
                          onClick={() => {
                            setChatInput(option);
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-center text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about products..."
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Chat input"
              />
              <button 
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                disabled={isLoading}
              >
                Send
              </button>
            </div>
          </form>
        </div>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 border-t"
          aria-label="Open shopping cart"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <span className="font-semibold">Shopping Cart</span>
          </div>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            {cartItems.length} items
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Search products"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 bg-white"
                aria-label="Open filters"
              >
                <Filter size={20} />
                Filters
              </button>
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map((category) => (
                <button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all"
              >
                <div className="relative">
                  <ProductPlaceholder />
                  <button 
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-gray-50"
                    aria-label="Add to favorites"
                  >
                    <Star size={16} className="text-gray-400" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <div className="flex items-center mb-2">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
                <Link 
                  href={`/store/${product.store.toLowerCase()}`}
                  className="text-gray-600 hover:text-green-600 hover:underline mb-2 block"
                >
                  {product.store}
                </Link>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">₦{product.price.toLocaleString()}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Dialog */}
      <CartDialog
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onCheckoutComplete={handleCheckoutComplete}
      />

    </div>
  );
};

export default MarketplaceView;