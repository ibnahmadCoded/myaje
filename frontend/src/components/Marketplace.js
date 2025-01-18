import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, PackageSearch, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogCancel, DialogAction } from "@/components/ui/dialog";
import Link from 'next/link';
//import { CheckoutDialog } from '@/components/CheckoutDialog'
import { CheckoutWithScript } from '@/components/CheckoutWithScript'
import { CartDialog } from '@/components/CartDialog'
import { Button } from '@/components/ui/button';
import { ProductModal } from '@/components/ProductModal'
import { apiBaseUrl, backendUrl } from '@/config';
import { useCart } from '@/app/providers/cart-provider';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

// product image SVG
const ProductImagePlaceholder = ({ onClick }) => (
  <div 
    className="aspect-[4/3] w-full relative bg-green-100 rounded-2xl flex items-center justify-center group hover:bg-green-200 transition-colors duration-300 cursor-pointer"
    onClick={onClick}
  >
    <PackageSearch size={48} className="text-green-300 group-hover:scale-110 transition-transform duration-300" />
  </div>
);

const ProductCard = ({ product, onImageClick }) => {
  const { addToCart } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null)
  const [productStats, setProductStats] = useState({
    views: 0,
    average_rating: 0,
    review_count: 0,
    wishlist_count: 0
  });
  const totalImages = product.images?.length || 0;

  const fetchProductStats = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/marketplace/${product.id}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const stats = await response.json();
      setProductStats(stats);
    } catch (error) {
      console.error('Failed to load product stats:', error);
    }
  };

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      setUser(user)
    }

    fetchProductStats();
  }, [product.id]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % totalImages);
  };

  const handleImageClick = () => {
    onImageClick({ product });
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 flex-1">
        <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-2xl">
          {totalImages > 0 ? (
            <div 
              className="w-full h-full relative cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={`${backendUrl}/${product.images[activeIndex].replace('./', '')}`}
                alt={product.name}
                className={`w-full h-full object-cover rounded-2xl transition-transform duration-500 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
              />
              {totalImages > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
            <ProductImagePlaceholder onClick={handleImageClick} />
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:line-clamp-none transition-all duration-300">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">
              {productStats.average_rating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            ({productStats.review_count} reviews)
          </span>
          <span className="text-sm text-gray-500 ml-auto">
            {productStats.views} views
          </span>
        </div>
        <Link 
          href={`/store/${product.store.toLowerCase().replace(/\s+/g, '-')}`} 
          className="text-sm text-gray-600 hover:text-green-600 hover:underline mb-3 inline-block transition-colors duration-300"
        >
          {product.store}
        </Link>
      </div>
      <div className="p-4 border-t mt-auto bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">₦{product.price.toLocaleString()}</span>
          {user?.id !== product.user_id && 
            <button
              onClick={() => {
                const result = addToCart(product);
                if (!result.success && result.error === 'business_view') {
                  setIsBusinessWarningOpen(true);
                } else {
                  toast({
                    title: "Success",
                    description: "Product successfully added to cart",
                    variant: "default"
                  });
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2 hover:gap-3"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          }
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ onSearch }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="flex-1 relative">
      <input 
        type="text"
        placeholder="Search products..."
        onChange={(e) => onSearch(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full px-4 py-3 pl-11 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${
          isFocused ? 'shadow-lg' : 'shadow-none'
        }`}
        aria-label="Search products"
      />
      <Search className={`absolute left-3 top-3.5 transition-colors duration-300 ${
        isFocused ? 'text-green-500' : 'text-gray-400'
      }`} size={20} />
    </div>
  );
};


const MarketplaceView = ({ products: initialProducts = [], isStorePage = false }) => { 
  const [isBusinessWarningOpen, setIsBusinessWarningOpen] = useState(false);
  //const [cartItems, setCartItems] = useState([]);
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
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();

const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
const [products, setProducts] = useState(initialProducts); 
const [selectedImage, setSelectedImage] = useState(null);
const [activeImageIndices, setActiveImageIndices] = useState({});
const [filteredProducts, setFilteredProducts] = useState(products);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/marketplace/get_products`); // Adjust API endpoint as needed
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

  // Handle checkout completion
  const handleCheckoutComplete = () => {
    clearCart();
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
  };

  // Modified addToCartWithQuantity for product modal
  const addToCartWithQuantity = (product) => {
    const result = addToCart(product, product.quantity);
    if (result.success) {
      setIsCartOpen(true);
    } else if (result.error === 'business_view') {
      setIsBusinessWarningOpen(true);
    }
  };

  // Modified addToCartThroughChat for chat functionality
  const addToCartThroughChat = (product, quantity = 1) => {
    const result = addToCart(product, quantity);
    return result.success;
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
  
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setChatInput('');
    setIsLoading(true);
  
    try {
      const response = await fetch(`${apiBaseUrl}/chat/chat_inference`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json', // Inform the server of the data format
        },
        body: JSON.stringify({ text: userMessage }), // Send userMessage as part of the POST body
      });
    
      if (!response.ok) {
        throw new Error('Failed to fetch response from chat inference API');
      }
      
      const result = await response.json(); 

      // Handle different intents based on the result
      switch (result.intent) {
        case 'find_products':
        case 'filter_products':
          let filteredResults = [...products];
          
          // Filter by name if provided
          if (result.product?.product_name !== undefined) {
            filteredResults = filteredResults.filter(product =>
              product.name.toLowerCase().includes(result.product.product_name.toLowerCase())
            );
          }
          
          // Filter by price range
          if (result.min_price !== undefined) {
            filteredResults = filteredResults.filter(product =>
              product.price >= result.min_price
            );
          }
          if (result.max_price !== undefined) {
            filteredResults = filteredResults.filter(product =>
              product.price <= result.max_price
            );
          }
          
          // Filter by category if provided
          if (result.category) {
            filteredResults = filteredResults.filter(product =>
              product.category.toLowerCase() === result.category.toLowerCase()
            );
          }

          setFilteredProducts(filteredResults);
          
          setChatMessages(prev => [...prev, {
            type: 'bot',
            text: filteredResults.length > 0
              ? "Here are the products matching your criteria."
              : "I couldn't find any products matching your criteria."
          }]);
          break;

        case 'greeting':
          setChatMessages(prev => [...prev, {
            type: 'bot',
            text: "Hello! How may I help you today?"
          }]);
          break;

        case 'add_to_cart':
          const productIndex = result.position; // Using zero-based index
          const productToAdd = filteredProducts[productIndex - 1]; // Convert 1-based to 0-based index
          const quantity = result.quantity || 1;
        
          if (productToAdd) {
            // Try to add the product to the cart
            const success = addToCartThroughChat(productToAdd, quantity);
            
            if (success) {
              setChatMessages(prev => [
                ...prev,
                {
                  type: 'bot',
                  text: `Added ${quantity} ${quantity > 1 ? 'units' : 'unit'} of ${productToAdd.name} to your cart.`,
                },
              ]);
            } else {
              setChatMessages(prev => [
                ...prev,
                {
                  type: 'bot',
                  text: "Sorry, I can't add this product to your cart because you are currently in business mode.",
                },
              ]);
            }
          } else {
            setChatMessages(prev => [
              ...prev,
              {
                type: 'bot',
                text: "I couldn't find the product you wanted to add to your cart.",
              },
            ]);
          }
          break;

        case 'checkout':
          setIsCheckoutOpen(true);
          setChatMessages(prev => [...prev, {
            type: 'bot',
            text: "I've opened the checkout for you."
          }]);
          break;

        case 'show_cart':
          setIsCartOpen(true);
          setChatMessages(prev => [...prev, {
            type: 'bot',
            text: "I've opened your cart for you."
          }]);
          break;

          case 'remove_from_cart':
            clearCart();
            setChatMessages(prev => [...prev, {type: 'bot', text: "I've removed all items from your cart.",},]);
            // if (result.remove_all) {
            //   clearCart();
            //   setChatMessages(prev => [
            //     ...prev,
            //     {
            //       type: 'bot',
            //       text: "I've removed all items from your cart.",
            //     },
            //   ]);
            // } else if (result.position !== undefined) {
            //   setCartItems(prevCartItems => {
            //     // Retrieve all current cart items
            //     const updatedCart = [...prevCartItems];
                
            //     // Adjust the position to be zero-based
            //     const position = result.position - 1;
            
            //     if (position >= 0 && position < updatedCart.length) {
            //       // Remove the item at the specified position
            //       const removedItem = updatedCart.splice(position, 1)[0]; // Get the removed item
            
            //       // Provide bot feedback
            //       setChatMessages(prev => [
            //         ...prev,
            //         {
            //           type: 'bot',
            //           text: `I've removed ${removedItem.name} from your cart.`,
            //         },
            //       ]);
            //     } else {
            //       // Handle invalid position
            //       setChatMessages(prev => [
            //         ...prev,
            //         {
            //           type: 'bot',
            //           text: "I couldn't find an item at that position in your cart.",
            //         },
            //       ]);
            //     }
            
            //     return updatedCart; // Return the updated cart
            //   });
            // }
            break;

        case 'save_for_later':
          if (result.index !== undefined) {
            const itemToSave = products[result.index];
            if (itemToSave) {
              addToWishlist(itemToSave);
              setChatMessages(prev => [...prev, {
                type: 'bot',
                text: `I've saved ${itemToSave.name} to your wishlist.`
              }]);
            }
          }
          break;

        default:
          setChatMessages(prev => [...prev, {
            type: 'bot',
            text: "I'm not sure how to help with that request. Could you please rephrase it?"
          }]);
      }
    } catch (error) {
      console.error("Error handling chat input:", error);
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: "Sorry, I encountered an error while processing your request."
      }]);
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
    <div className="flex max-h-[calc(100vh-4rem)]">
      {/* Left Column - Chat */}
      <div className="w-96 bg-white border-r hidden lg:block">
        <div className="h-full flex flex-col">
          {/* Chat Header */}
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.type === "user"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100"
                  } shadow-sm hover:shadow-md transition-shadow duration-300`}
                >
                  <p>{message.text}</p>
                  {message.options && (
                    <div className="mt-2 space-y-2">
                      {message.options.map((option, i) => (
                        <button
                          key={i}
                          className="block w-full text-left px-3 py-2 rounded bg-white text-green-600 hover:bg-green-50 text-sm transition-all duration-300 hover:translate-x-1"
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
              <div className="flex gap-2 items-center text-gray-500 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t bg-white">
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about products..."
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isLoading}
              >
                Send
                <span className={`transform transition-transform ${isLoading ? 'rotate-180' : ''}`}>
                  →
                </span>
              </button>
            </form>
          </div>

          {/* Shopping Cart Button */}
          <div className="border-t">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-300"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-green-600" />
                <span className="font-semibold">Shopping Cart</span>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full transition-all duration-300 hover:bg-green-200">
                {cartItems.length} items
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
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

      {/* Business Warning Modal */}
      <Dialog open={isBusinessWarningOpen} onOpenChange={() => setIsBusinessWarningOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Personal Account</DialogTitle>
            <DialogDescription>
              Purchases with business accounts are not allowed on MyAje. Please switch to your personal account view to continue shopping.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <CheckoutWithScript 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onCheckoutComplete={handleCheckoutComplete}
      />

      <ProductModal 
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(undefined)}
        product={selectedImage?.product}
        onAddToCart={addToCartWithQuantity}
      />

    </div>
  );
};

export default MarketplaceView;