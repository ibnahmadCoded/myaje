'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Eye, AlertTriangle, Bell } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/inventory', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setInventoryProducts(data);
    } catch (error) {
      setError('Failed to fetch inventory');
    }
  };

  const fetchStoreProducts = async () => {
    try {
      const response = await fetch('/api/storefront/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStoreProducts(data);
    } catch (error) {
      setError('Failed to fetch store products');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/storefront/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchStoreProducts();
    fetchOrders();
  }, []);

  const handleAddToStore = async () => {
    try {
      for (const productId of selectedProducts) {
        await fetch('/api/storefront/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ product_id: productId })
        });
      }
      fetchStoreProducts();
      setSelectedProducts([]);
    } catch (error) {
      setError('Failed to add products to store');
    }
  };

  const ProductSelector = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {inventoryProducts
          .filter(p => !storeProducts.find(sp => sp.id === p.id))
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
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  Stock: {product.quantity} | Price: ${product.price}
                </p>
              </div>
            </div>
          ))}
      </div>
      <button
        onClick={handleAddToStore}
        disabled={selectedProducts.length === 0}
        className="w-full bg-green-100 hover:bg-green-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        Add Selected Products to Store
      </button>
    </div>
  );

  const StorefrontPreview = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your Store</h2>
      <div className="grid grid-cols-2 gap-6">
        {storeProducts.map(product => (
          <div key={product.id} className="border rounded-lg p-4">
            <div className="aspect-w-1 aspect-h-1 w-full mb-4">
              <img
                src="/api/placeholder/400/400"
                alt={product.name}
                className="object-cover rounded-lg"
              />
            </div>
            <h3 className="font-medium text-lg">{product.name}</h3>
            <p className="text-gray-500 mb-2">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="font-bold">${product.price}</span>
              <button className="bg-green-100 hover:bg-green-200 text-gray-700 px-4 py-2 rounded">
                Add to Cart
              </button>
            </div>
            {product.quantity <= product.low_stock_threshold && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <AlertTriangle size={16} className="mr-1" />
                Low Stock
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const OrdersList = () => (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">Order #{order.id}</h3>
              <p className="text-sm text-gray-500">
                {order.customer_name} ({order.customer_email})
              </p>
            </div>
            <span className="px-2 py-1 rounded-full text-sm bg-amber-100">
              {order.status}
            </span>
          </div>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.product_name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-2 border-t flex justify-between font-medium">
            <span>Total</span>
            <span>${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Storefront Management</h1>
            <div className="flex space-x-4">
            <button
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-amber-100 hover:bg-amber-200 text-gray-700 font-bold py-2 px-4 rounded flex items-center"
            >
                <Eye size={20} className="mr-2" />
                {previewMode ? 'Exit Preview' : 'Preview Store'}
            </button>
            <Dialog>
                <DialogTrigger asChild>
                <button className="bg-green-100 hover:bg-green-200 text-gray-700 font-bold py-2 px-4 rounded flex items-center">
                    <Plus size={20} className="mr-2" />
                    Add Products
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

        {error && (
            <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
            </Alert>
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
                    <div key={product.id} className="border rounded-lg p-4">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-gray-500 mb-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                        <span className="font-bold">${product.price}</span>
                        <span className="text-sm text-gray-500">
                        Stock: {product.quantity}
                        </span>
                    </div>
                    {product.quantity <= product.low_stock_threshold && (
                        <div className="mt-2 flex items-center text-red-600 text-sm">
                        <AlertTriangle size={16} className="mr-1" />
                        Low Stock
                        </div>
                    )}
                    </div>
                ))}
                </div>
            </TabsContent>
            <TabsContent value="orders">
                <OrdersList />
            </TabsContent>
            </Tabs>
        )}
        </div>
    </DashboardLayout>
  );
};

export default StorefrontManagement;