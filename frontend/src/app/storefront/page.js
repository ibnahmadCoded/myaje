'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Eye, ChevronLeft, ChevronRight, Bell, Edit, Trash2, Share2, PackageSearch, ShoppingCart, CheckCircle, Star } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiBaseUrl, backendUrl } from '@/config';
import { useToast } from "@/hooks/use-toast";

const StorefrontManagement = () => {
  const { toast } = useToast();
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  //const [selectedProducts, setSelectedProducts] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [productPrices, setProductPrices] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [storeDetails, setStoreDetails] = useState({
    tagline: '',
    street_address: '',
    phone_number: '',
    contact_email: ''
  });
  const [isEditingStoreDetails, setIsEditingStoreDetails] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Fetch functions
  const fetchInventoryProducts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/inventory/get_inventory`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setInventoryProducts(data);
    } catch (error) {
      setError(`Failed to fetch inventory products, ${error}`);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/storefront/get_products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (Array.isArray(data) && data.length === 0) {
        setStoreProducts([]);
      } else {
        setStoreProducts(data);
      }
    } catch (error) {
      setError(`Failed to fetch store products, ${error}`);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/orders/seller/list`, { 
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      setError(`Failed to fetch orders, ${error}`);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Check if user data is available in local storage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        // Parse the JSON string into an object and set the user state
        const user = JSON.parse(storedUser);
        setUser(user);
      } 
    } catch (error) {
      console.error(error);
      setError('Failed to fetch user profile');
    }
  };

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/storefront/get_store_details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStoreDetails(data);
    } catch (error) {
      console.error('Failed to fetch store details', error);
    }
  };

  const handleUpdateStoreDetails = async () => {
    try {
      await fetch(`${apiBaseUrl}/storefront/update_store_details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(storeDetails)
      });
      setIsEditingStoreDetails(false);
      fetchStoreDetails();
      toast({
        title: "Success",
        description: "Store details updated successfully.",
      });
    } catch (error) {
      setError('Failed to update store details');
      toast({
        title: "Error",
        description: error.message,
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchInventoryProducts(), 
          fetchStoreProducts(), 
          fetchOrders(),
          fetchUserProfile(),
          fetchStoreDetails
        ]);
      } catch (error) {
        setError(`Failed to load data, ${error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  

  const handleUpdatePrice = async () => {
    if (!editingProduct) return;

    try {
      await fetch(`${apiBaseUrl}/storefront/update_products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          storefront_price: parseFloat(productPrices[editingProduct.id])
        })
      });
      fetchStoreProducts();
      setEditingProduct(null);
      setProductPrices({});
    } catch (error) {
      setError(`Failed to update product price, ${error}`);
    }
  };

  const handleFulfillOrder = async (orderId) => {
    try {
      await fetch(`${apiBaseUrl}/orders/seller/${orderId}/fulfill`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchOrders();
    } catch (error) {
      setError(`Failed to fulfill order, ${error}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await fetch(`${apiBaseUrl}/orders/seller/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOrderToDelete(null);
      fetchOrders();
    } catch (error) {
      setError(`Failed to delete order, ${error}`);
    }
  };

  if(isEditingStoreDetails){
    //console.log("Editing store front")
  }

  const OrdersList = () => {
    return (
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Order #{order.id}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status}
                </span>
                {order.status === 'pending' && (
                  <Button 
                    onClick={() => handleFulfillOrder(order.id)}
                    className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700"
                    size="sm"
                  >
                    <CheckCircle size={16} />
                    Fulfill
                  </Button>
                )}
                <Button
                  onClick={() => setOrderToDelete(order)}
                  className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700"
                  size="sm"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </div>
            <div className="text-gray-600">
              <p>Total: ₦{order.total_amount}</p>
              <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}

        {/* Delete Order Confirmation Dialog */}
        {orderToDelete && (
          <Dialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Order</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete Order #{orderToDelete.id}? 
                  {orderToDelete.status === 'pending' && " This will restore the product quantities."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <div className="flex space-x-2 justify-end">
                  <Button
                    onClick={() => setOrderToDelete(null)}
                    className="bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDeleteOrder(orderToDelete.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  };

  // product image SVG
  const ProductImagePlaceholder = () => (
    <div className="aspect-[4/3] w-full relative bg-green-100 rounded-2xl flex items-center justify-center">
      <PackageSearch size={48} className="text-green-300" />
    </div>
  );

  const ProductSelector = () => {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productPrices, setProductPrices] = useState({});
    const inputRefs = useRef({}); // Store references to inputs
  
    const handleCheckboxChange = (productId, isChecked) => {
      if (isChecked) {
        setSelectedProducts((prev) => [...prev, productId]);
      } else {
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));
        setProductPrices((prev) => {
          const updatedPrices = { ...prev };
          delete updatedPrices[productId];
          return updatedPrices;
        });
      }
    };
  
    const handlePriceChange = (productId, newPrice) => {
      setProductPrices((prev) => ({
        ...prev,
        [productId]: newPrice,
      }));
    };

    const handleAddToStore = async () => {
      try {
        for (const productId of selectedProducts) {
          const price = productPrices[productId];
          if (!price) continue;
  
          await fetch(`${apiBaseUrl}/storefront/add_products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
              product_id: productId,
              storefront_price: parseFloat(price)
            })
          });
        }
        fetchStoreProducts();
        setSelectedProducts([]);
        setProductPrices({});
      } catch (error) {
        setError(`Failed to add products to store, ${error}`);
      }
    };
  
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {inventoryProducts
            .filter((p) => !storeProducts.find((sp) => sp.product_id === p.id))
            .map((product) => {
              const isSelected = selectedProducts.includes(product.id);
  
              return (
                <div
                  key={product.id}
                  className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="mr-4"
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(product.id, e.target.checked)}
                  />
                  <div className="flex-grow">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      Stock: {product.quantity} | Original Price: ₦{product.price}
                    </p>
                  </div>
                  {isSelected && (
                    <input
                      type="number"
                      ref={(el) => (inputRefs.current[product.id] = el)} // Store the reference
                      className="w-24 p-2 border rounded"
                      placeholder="Price"
                      value={productPrices[product.id] || ""}
                      onChange={(e) => handlePriceChange(product.id, e.target.value)}
                      onFocus={() => {
                        // Restore focus if re-rendered
                        inputRefs.current[product.id]?.focus();
                      }}
                    />
                  )}
                </div>
              );
            })}
        </div>
        <button
          onClick={handleAddToStore}
          disabled={
            selectedProducts.length === 0 ||
            !selectedProducts.every((id) => productPrices[id])
          }
          className="w-full bg-green-100 hover:bg-green-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Add Selected Products to Store
        </button>
      </div>
    );
  };

  const handleDeleteFromStore = async (productId) => {
    try {
      await fetch(`${apiBaseUrl}/storefront/delete_products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchStoreProducts();
      setDeleteConfirmation(null);
    } catch (error) {
      setError(`Failed to remove product from store, ${error}`);
    }
  };

  const ProductCard = ({ product, isPreview }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = product.images || [];
    const [productStats, setProductStats] = useState({
        views: 0,
        average_rating: 0,
        review_count: 0,
        wishlist_count: 0
      });
    const displayImages = images.length > 0 
      ? images.map(img => `${backendUrl}/${img.replace('./', '')}`)
      : [];
  
    const handleNextImage = (e) => {
      e.stopPropagation();
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % displayImages.length
      );
    };
  
    const handlePrevImage = (e) => {
      e.stopPropagation();
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
      );
    };

    const fetchProductStats = useCallback(async () => {
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
      }, [product.id]);
    
      useEffect(() => {
        fetchProductStats();
      }, [fetchProductStats]);
  
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
        <div className="p-4 flex-1">
          <div className="relative aspect-[4/3] mb-4">
            {displayImages.length > 0 ? (
              <div className="w-full h-full relative cursor-pointer">
                <img
                  src={displayImages[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-2xl transform hover:scale-105 transition-transform duration-300"
                  onClick={() => setSelectedImage(displayImages[currentImageIndex])}
                />
                {displayImages.length > 1 && (
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
                  {currentImageIndex + 1}/{displayImages.length}
                </div>
              </div>
            ) : (
              <div className="w-full h-full">
                <ProductImagePlaceholder />
              </div>
            )}
  
            {!isPreview && product.quantity <= product.low_stock_threshold && (
              <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                Low Stock
              </div>
            )}
          </div>
  
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        </div>

        <div className="flex items-center gap-2 mb-2 p-2">
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
  
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">₦{product.storefront_price || product.price}</span>    
            {isPreview ? (
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <ShoppingCart size={16} />
                Add
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setProductPrices({
                      [product.id]: product.storefront_price
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Edit size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={() => setDeleteConfirmation(product)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Trash2 size={18} className="text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const StorefrontPreview = () => (
    <div className="max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative px-8 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">{user?.business_name || 'Your Store Name'}</h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-lg opacity-90 mb-4">{storeDetails?.tagline || 'Quality Products for Every Need'}</p>
            <div className="text-sm opacity-80">
              <p>{storeDetails?.street_address || '123 Main St, City, Country'}</p>
              <p>Phone: {storeDetails?.phone_number || '+1 234 567 8900'} | Email: {storeDetails?.contact_email || 'store@example.com'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Store Button */}
      <div className="flex justify-end mb-6">
        <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full transition-colors">
          <Share2 size={18} />
          <span>Share Store</span>
        </button>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {storeProducts.map(product => (
          <ProductCard key={product.id} product={product} isPreview={true} />
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
      {!previewMode && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Storefront Management</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center bg-blue-100 hover:bg-blue-200 text-gray-700 px-4 py-2 rounded"
            >
              {previewMode ? 'Edit Store' : 'Preview Store'}
              <Eye className="ml-2" size={16} />
            </button>
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center bg-green-100 hover:bg-green-200 text-gray-700 px-4 py-2 rounded">
                  Add Products
                  <Plus className="ml-2" size={16} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Products to Store</DialogTitle>
                  <DialogDescription></DialogDescription>
                </DialogHeader>
                <ProductSelector />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Preview mode will now only show the 'Edit Store' button */}
      {previewMode && (
        <div className="mb-4">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center bg-blue-100 hover:bg-blue-200 text-gray-700 px-4 py-2 rounded"
          >
            Edit Store
            <Eye className="ml-2" size={16} />
          </button>
        </div>
      )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Store Details Section */}
        {!previewMode && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Store Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tagline</label>
              <input
                value={storeDetails.tagline}
                onChange={(e) => setStoreDetails({...storeDetails, tagline: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={storeDetails?.tagline || "Enter store tagline"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                value={storeDetails.street_address}
                onChange={(e) => setStoreDetails({...storeDetails, street_address: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={storeDetails?.street_address || "Enter street address"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                value={storeDetails.phone_number}
                onChange={(e) => setStoreDetails({...storeDetails, phone_number: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={storeDetails?.phone_number || "Enter phone number"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input
                value={storeDetails.contact_email}
                onChange={(e) => setStoreDetails({...storeDetails, contact_email: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={storeDetails?.contact_email || "Enter contact email"}
              />
            </div>
          </div>
          <button
            onClick={handleUpdateStoreDetails}
            className="mt-4 bg-green-100 hover:bg-green-200 text-gray-700 font-bold py-2 px-4 rounded"
          >
            Update Store Details
          </button>
        </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Bell size={32} className="animate-pulse text-gray-500" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : previewMode ? (
          <StorefrontPreview />
        ) : (
          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Store Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeProducts.map(product => (
                  <ProductCard key={product.id} product={product} isPreview={false} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="orders">
              <OrdersList />
            </TabsContent>
          </Tabs>
        )}

        {/* Edit Price Dialog */}
        {editingProduct && (
          <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Price - {editingProduct.name}</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Storefront Price
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={productPrices[editingProduct.id] || ''}
                    onChange={(e) => setProductPrices({
                      ...productPrices,
                      [editingProduct.id]: e.target.value
                    })}
                  />
                </div>
                <button
                  onClick={handleUpdatePrice}
                  className="w-full bg-green-100 hover:bg-green-200 text-gray-700 font-bold py-2 px-4 rounded"
                >
                  Update Price
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmation && (
          <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Product from Store</DialogTitle>
                <DialogDescription>
                  `Are you sure you want to remove {deleteConfirmation.name} from your store?
                  This action can't be undone.`
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteFromStore(deleteConfirmation.id)}
                    className="px-4 py-2 rounded bg-red-100 hover:bg-red-200 text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal for Image */}
        {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Image</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
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
    </DashboardLayout>
  );
};

export default StorefrontManagement;