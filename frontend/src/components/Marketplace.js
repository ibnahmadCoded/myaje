import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, PackageSearch, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { CheckoutDialog } from '@/components/CheckoutDialog'
import { CartDialog } from '@/components/CartDialog'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import OpenAI from "openai";
import axios from 'axios';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

const openai = new OpenAI({ apiKey: 'sk-proj-0EniH43RL23qNaCBYlQS5I5JPVVrBUPZF7UX-iixXxxyML-Zfgobxb5tmmB766F1njxsXpk8MZT3BlbkFJx1h07HJHMucY5MeaLQVJF7rQcY9l8rxCJuLyHHoVu6GkFrYiQYcB3_gaL4uFWi4T-Rwm69B7YA', dangerouslyAllowBrowser: true })

// product image SVG
const ProductImagePlaceholder = () => (
  <div className="aspect-[4/3] w-full relative bg-green-100 rounded-2xl flex items-center justify-center">
    <PackageSearch size={48} className="text-green-300" />
  </div>
);

const ProductCard = ({ product, onAddToCart, onImageClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalImages = product.images?.length || 0;

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % totalImages);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="p-4 flex-1">
        <div className="relative aspect-[4/3] mb-4">
          {totalImages > 0 ? (
            <div 
              className="w-full h-full relative cursor-pointer"
              onClick={() => onImageClick(`http://localhost:8000/${product.images[activeIndex].replace('./', '')}`)}
            >
              <img
                src={`http://localhost:8000/${product.images[activeIndex].replace('./', '')}`}
                alt={product.name}
                className="w-full h-full object-cover rounded-2xl transform hover:scale-105 transition-transform duration-300"
              />
              {totalImages > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {activeIndex + 1}/{totalImages}
              </div>
            </div>
          ) : (
            <ProductImagePlaceholder />
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
          </div>
          <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
        </div>
        {/* 
        <Link 
          href={`/store/${product.store.toLowerCase()}`} 
          className="text-sm text-gray-600 hover:text-green-600 hover:underline mb-3 inline-block"
        >
          {product.store}
        </Link> */}
        <Link 
          href={`/store/${product.store.toLowerCase().replace(/\s+/g, '-')}`} 
          className="text-sm text-gray-600 hover:text-green-600 hover:underline mb-3 inline-block"
        >
          {product.store}
        </Link>
      </div>
      <div className="p-4 border-t mt-auto">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">₦{product.price.toLocaleString()}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ onSearch }) => (
  <div className="flex-1 relative">
    <input 
      type="text"
      placeholder="Search products..."
      onChange={(e) => onSearch(e.target.value)}
      className="w-full px-4 py-3 pl-11 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
      aria-label="Search products"
    />
    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
  </div>
);

const MarketplaceView = ({ products: initialProducts = [], isStorePage = false }) => { // should be initial_products = []
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
const [products, setProducts] = useState(initialProducts); 
const [selectedImage, setSelectedImage] = useState(null);
const [activeImageIndices, setActiveImageIndices] = useState({});
const [filteredProducts, setFilteredProducts] = useState(products);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8000/marketplace/get_products'); // Adjust API endpoint as needed
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const apiProducts = await response.json(); // Expecting an array of products from the API
      //setProducts((prevProducts) => [...apiProducts, ...prevProducts]); // Prepend API products
      setProducts(apiProducts); 
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    if (!isStorePage && initialProducts.length === 0) {
      fetchProducts();
    }
  }, [isStorePage]);

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

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
  
    const userMessage = chatInput;

    console.log(userMessage)
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setChatInput('');
    setIsLoading(true);
  
    try {
      // Call OpenAI to determine intent and parameters
      //const API_KEY = "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";
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "system",
            "content": [
              {
                "type": "text",
                "text": `
                  You are a helpful assistant that answers programming questions 
                  in the style of a southern belle from the southeast United States.
                `
              }
            ]
          },
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Are semicolons optional in JavaScript?"
              }
            ]
          }
        ]
      });
  
      const result = response.data.choices[0].message.content.trim();

      console.log(result)

      const { intent, parameters } = JSON.parse(result); // Parse intent and parameters

      const normalizedIntent = intent.trim().toLowerCase();
  
      if (normalizedIntent === "get_product") {
        // Filter products based on parameters
        const filtered = products.filter(product =>
          Object.entries(parameters).every(([key, value]) => {
            if (typeof value === "object" && value !== null) {
              // Check for range or condition object
              const { operator, target } = value;
              switch (operator) {
                case ">=":
                  return product[key] >= target;
                case "<=":
                  return product[key] <= target;
                case ">":
                  return product[key] > target;
                case "<":
                  return product[key] < target;
                case "==":
                  return product[key] == target;
                case "=":
                  return product[key] == target;
                case "!=":
                  return product[key] != target;
                default:
                  throw new Error(`Unsupported operator: ${operator}`);
              }
            } else {
              // Default to string matching
              return String(product[key]).toLowerCase().includes(String(value).toLowerCase());
            }
          })
        );
  
        // Update the products state
        //setFilteredProducts(filtered);
        if (filtered.length > 0 && JSON.stringify(filtered) !== JSON.stringify(filteredProducts)) {
          setFilteredProducts(filtered);
        }
  
        // Add a confirmation message to the chat
        setChatMessages(prev => [
          ...prev,
          {
            type: 'bot',
            text: filtered.length > 0
              ? "I've filtered the products based on your query. Check the main window."
              : "I couldn't find any products matching your query.",
          },
        ]);
      } else if (normalizedIntent === "add_to_cart") {
        // Handle "add to cart" logic
        const productToAdd = products[parameters.index - 1]; // Assuming parameters.index is 1-based
        if (productToAdd) {
          addToCart(productToAdd);
          setChatMessages(prev => [
            ...prev,
            { type: 'bot', text: `Added ${productToAdd.name} to your cart.` },
          ]);
        } else {
          setChatMessages(prev => [
            ...prev,
            { type: 'bot', text: "I couldn't find the product to add to your cart." },
          ]);
        }
      } else if (normalizedIntent === "checkout") {
        // Handle "checkout" logic
        setIsCheckoutOpen(true);
        setChatMessages(prev => [
          ...prev,
          { type: 'bot', text: "I've opened the checkout for you." },
        ]);
      }  else if (normalizedIntent === "greet") {
        // Step 3: Fetch greeting reply from OpenAI
        const greetingResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are a polite and friendly assistant." },
              { role: "user", content: `Reply to this greeting: "${userMessage}"` },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`,
            },
          }
        );
  
        const greetingReply = greetingResponse.data.choices[0].message.content.trim();
  
        setChatMessages((prev) => [
          ...prev,
          { type: 'bot', text: greetingReply },
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          { type: 'bot', text: "Sorry, I didn't understand that request." },
        ]);
      }
    } catch (error) {
      console.error("Error handling chat input:", error);
      setChatMessages(prev => [
        ...prev,
        { type: 'bot', text: "Something went wrong while processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFilteredProducts(
      products.filter(
        (product) => selectedCategory === 'All' || product.category === selectedCategory
      )
    );
  }, [products, selectedCategory]);

  useEffect(() => {
    // Initialize active image index for products with images
    const initialIndexes = {};
    products.forEach(product => {
      if (product.images && product.images.length > 0) {
        initialIndexes[product.id] = 0;
      }
    });
    setActiveImageIndices(initialIndexes);
  }, [products]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Column - Chat */}
      <div className="w-96 bg-white border-r hidden lg:flex flex-col h-full">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-green-50 border-b">
            <div className="flex items-center gap-2">
              <PackageSearch size={24} className="text-green-600" />
              <div>
                <h3 className="font-semibold">AI Shopping Assistant</h3>
                <p className="text-sm text-gray-600">Powered by advanced AI</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ maxHeight: "calc(100vh - 4rem - 8rem)" }} // Adjust for header/footer
            role="log"
            aria-live="polite"
          >
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.type === "user"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
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

          {/* Chat Input */}
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

        {/* Shopping Cart Button */}
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
        <div className="max-w-7xl mx-auto p-2">
          {/* Search and Filters */}
          <div className="sticky top-0 z-10 bg-gray-50 pb-4">
            <div className="flex gap-4 mb-4">
              <SearchBar onSearch={(value) => console.log('Searching:', value)} />
              <Button 
                variant="outline"
                className="flex items-center gap-2 px-4"
              >
                <Filter size={20} />
                Filters
              </Button>
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onImageClick={setSelectedImage}
              />
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

      {/* Modal for Image */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent>
          <DialogTitle>Product Image</DialogTitle>
          <DialogDescription>This is the image of the product</DialogDescription>
          <img
            src={selectedImage}
            alt="Product"
            className="w-full h-auto rounded-md shadow-md"
          />
          <Button
            className="mt-4 w-full"
            onClick={() => setSelectedImage(null)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      )}

    </div>
  );
};

export default MarketplaceView;