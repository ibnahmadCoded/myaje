'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

import { Search, ShoppingCart, Star, PackageSearch } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard'; // We'll create this 
import DashboardLayout from '@/components/DashboardLayout';
import { apiBaseUrl } from '@/config';

import { useCart } from '@/app/providers/cart-provider';

const MyItemsView = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  //const [startDate, setStartDate] = useState(null);
  //const [endDate, setEndDate] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const { addToCart } = useCart();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure we're in a browser environment before accessing localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authorization token is missing');
        }
  
        const params = new URLSearchParams({
          page,
          limit: 12,
          search: searchTerm,
          // ...(startDate && { start_date: startDate.toISOString() }),
          // ...(endDate && { end_date: endDate.toISOString() }),
          ...(activeTab === 'orders' && { status: orderStatus })
        });
  
        const response = await fetch(
          `${apiBaseUrl}/my_items/${activeTab}?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
  
        if (!response.ok) throw new Error('Failed to fetch items');
  
        const data = await response.json();
        setItems(data.items);
        setTotalPages(data.pages);
      } else {
        throw new Error('Window not found, localStorage is unavailable');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to load items. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, orderStatus, page, searchTerm, toast]);  

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddToCart = (product) => {
    // Check if we're in the browser (client-side)
    if (typeof window !== 'undefined') {
      const result = addToCart(product);
      
      if (!result.success && result.error === 'business_view') {
        toast({
          title: "Switch to Personal Account",
          description: "Purchases with business accounts are not allowed. Please switch to your personal account view to continue shopping.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Added to Cart",
        description: "Item has been added to cart. Please go to marketplace to proceed to checkout.",
        action: (
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => window.location.href = '/'}
          >
            Open Marketplace
          </Button>
        ),
      });
    }
  };  

  return (
    <DashboardLayout>
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <PackageSearch size={16} />
            My Orders
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star size={16} />
            My Reviews
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex items-center gap-2">
            <ShoppingCart size={16} />
            My Wishlist
          </TabsTrigger>
        </TabsList>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-center">
            
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === 'orders' && (
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
            
          </div>
        </div>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((order) => (
              <div key={order?.id} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Order #{order.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      order?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order?.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order?.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Ordered on {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                {order?.items?.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onAddToCart={handleAddToCart}
                    showOrderButton
                  />
                ))}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <ProductCard
                  product={review.product}
                  onAddToCart={handleAddToCart}
                />
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {review.review_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard
                  product={item.product}
                  onAddToCart={handleAddToCart}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded-full shadow">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  onClick={() => setPage(i + 1)}
                  className="w-10 h-10 p-0"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <PackageSearch size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No items found</h3>
            <p className="text-gray-500">
              {activeTab === 'orders' && "You haven't placed any orders yet."}
              {activeTab === 'reviews' && "You haven't reviewed any products yet."}
              {activeTab === 'wishlist' && "Your wishlist is empty."}
            </p>
          </div>
        )}
      </Tabs>
    </div>
    </DashboardLayout>
  );
};

export default MyItemsView;