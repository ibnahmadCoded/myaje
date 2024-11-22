'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Eye, ChevronLeft, ChevronRight, Bell, Edit, Trash2, Share2 } from 'lucide-react';
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

const StorefrontManagement = () => {
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
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

  // Fetch functions
  const fetchInventoryProducts = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/get_inventory', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setInventoryProducts(data);
    } catch (error) {
      setError('Failed to fetch inventory products');
    }
  };

  const fetchStoreProducts = async () => {
    try {
      const response = await fetch('http://localhost:8000/storefront/get_products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log(data)
      setStoreProducts(data);
    } catch (error) {
      setError('Failed to fetch store products');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', { // later
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      setError('Failed to fetch orders');
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
      const response = await fetch('http://localhost:8000/storefront/get_store_details', {
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
      await fetch('http://localhost:8000/storefront/update_store_details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(storeDetails)
      });
      setIsEditingStoreDetails(false);
      fetchStoreDetails();
    } catch (error) {
      setError('Failed to update store details');
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
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToStore = async () => {
    try {
      for (const productId of selectedProducts) {
        const price = productPrices[productId];
        if (!price) continue;

        await fetch('http://localhost:8000/storefront/add_products', {
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
      setError('Failed to add products to store');
    }
  };

  const handleUpdatePrice = async () => {
    if (!editingProduct) return;

    try {
      await fetch(`http://localhost:8000/storefront/update_products/${editingProduct.id}`, {
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
      setError('Failed to update product price');
    }
  };

  const OrdersList = () => {
    return (
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Order #{order.id}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="text-gray-600">
              <p>Total: ${order.total}</p>
              <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ProductSelector = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {inventoryProducts
          .filter(p => !storeProducts.find(sp => sp.product_id === p.id))
          .map(product => (
            <div
              key={product.id}
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="mr-4"
                checked={selectedProducts.includes(product.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProducts([...selectedProducts, product.id]);
                  } else {
                    setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                  }
                }}
              />
              <div className="flex-grow">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  Stock: {product.quantity} | Original Price: ${product.price}
                </p>
              </div>
              {selectedProducts.includes(product.id) && (
                <input
                  type="number"
                  className="w-24 p-2 border rounded"
                  placeholder="Price"
                  value={productPrices[product.id] || ''}
                  onChange={(e) => setProductPrices({
                    ...productPrices,
                    [product.id]: e.target.value
                  })}
                />
              )}
            </div>
          ))}
      </div>
      <button
        onClick={handleAddToStore}
        disabled={selectedProducts.length === 0 || 
          !selectedProducts.every(id => productPrices[id])}
        className="w-full bg-green-100 hover:bg-green-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        Add Selected Products to Store
      </button>
    </div>
  );

  const handleDeleteFromStore = async (productId) => {
    try {
      await fetch(`/api/storefront/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchStoreProducts();
      setDeleteConfirmation(null);
    } catch (error) {
      setError('Failed to remove product from store');
    }
  };

  const ProductCard = ({ product, isPreview }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = product.images || [];
    const displayImages = images.length > 0 
      ? images.map(img => `http://localhost:8000/${img.replace('./', '')}`)
      : ['/api/placeholder/400/400'];
  
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
  
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:shadow-lg hover:-translate-y-1">
        <div className="relative pb-[100%]">
          <img
            src={displayImages[currentImageIndex]}
            alt={product.name}
            className="absolute top-0 left-0 h-full w-full object-cover cursor-pointer"
          />
          
          {displayImages.length > 1 && (
            <>
              <button 
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1 hover:bg-white/75"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1 hover:bg-white/75"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
  
          {!isPreview && product.quantity <= product.low_stock_threshold && (
            <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
              Low Stock
            </div>
          )}
  
          {displayImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {displayImages.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === currentImageIndex ? 'bg-white/90' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-green-600">
              ${product.storefront_price || product.price}
            </span>
            
            {isPreview ? (
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm transition-colors">
                Add to Cart
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
                placeholder={storeDetails.tagline || "Enter store tagline"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                value={storeDetails.street_address}
                onChange={(e) => setStoreDetails({...storeDetails, street_address: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={storeDetails.street_address || "Enter street address"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                value={storeDetails.phone_number}
                onChange={(e) => setStoreDetails({...storeDetails, phone_number: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={storeDetails.phone_number || "Enter phone number"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input
                value={storeDetails.contact_email}
                onChange={(e) => setStoreDetails({...storeDetails, contact_email: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={storeDetails.contact_email || "Enter contact email"}
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
                  Are you sure you want to remove "{deleteConfirmation.name}" from your store?
                  This action can't be undone.
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