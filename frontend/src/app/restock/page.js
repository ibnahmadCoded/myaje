'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Package, Plus, Truck, Search, RefreshCw, Clock, CheckCircle2, PackageCheck } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const RestockRequestPage = () => {
  const [existingProducts, setExistingProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestType, setRequestType] = useState('existing');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    quantity: '',
    description: '',
    address: '',
    additionalNotes: '',
    urgency: 'normal'
  });

  useEffect(() => {
    fetchRequests();
    fetchProducts();
  }, []);

  const fetchRequests = async () => {
    // Simulated data - replace with actual API call
    setRequests([
      {
        id: 1,
        productName: "Premium Coffee Beans",
        quantity: 50,
        status: "pending",
        requestDate: "2024-12-11",
        expectedDelivery: "2024-12-12",
        type: "existing",
        urgency: "high"
      },
      {
        id: 2,
        productName: "Organic Tea Bags",
        quantity: 100,
        status: "approved",
        requestDate: "2024-12-10",
        expectedDelivery: "2024-12-11",
        type: "new",
        urgency: "normal"
      }
    ]);
  };

  const fetchProducts = async () => {
    // Simulated data - replace with actual API call
    setExistingProducts([
      { id: 1, name: "Premium Coffee Beans", currentStock: 20 },
      { id: 2, name: "Organic Tea Bags", currentStock: 15 },
      { id: 3, name: "Herbal Green Tea", currentStock: 30 }
    ]);
  };

  const handleSubmit = async () => {
    try {
      // Add validation
      if (!formData.quantity || (requestType === 'existing' && !formData.productId) || 
          (requestType === 'new' && !formData.productName) || !formData.address) {
        throw new Error('Please fill in all required fields');
      }

      // Simulated API call - replace with actual implementation
      // const response = await fetch('/api/restock-requests', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      toast({
        title: "Success",
        description: "Restock request submitted successfully. Expected delivery by tomorrow.",
      });
      setShowNewRequestDialog(false);
      fetchRequests();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      quantity: '',
      description: '',
      address: '',
      additionalNotes: '',
      urgency: 'normal'
    });
    setRequestType('existing');
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'approved': 'success',
      'delivered': 'default',
      'cancelled': 'destructive'
    };
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatusCard = ({ title, count, icon: Icon, color }) => (
    <Card className={`p-4 bg-${color}-50`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-${color}-100`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Restock Requests</h1>
          <Button onClick={() => setShowNewRequestDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        <Alert>
          <Truck className="h-4 w-4" />
          <AlertDescription>
            All restock requests are processed with next-day delivery guarantee.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            title="Total Requests"
            count={requests.length}
            icon={Package}
            color="blue"
          />
          <StatusCard
            title="Pending"
            count={requests.filter(r => r.status === 'pending').length}
            icon={Clock}
            color="yellow"
          />
          <StatusCard
            title="Approved"
            count={requests.filter(r => r.status === 'approved').length}
            icon={CheckCircle2}
            color="green"
          />
          <StatusCard
            title="Delivered"
            count={requests.filter(r => r.status === 'delivered').length}
            icon={PackageCheck}
            color="purple"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <Table>
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-left">Quantity</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Request Date</th>
                <th className="p-4 text-left">Expected Delivery</th>
                <th className="p-4 text-left">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{request.productName}</td>
                  <td className="p-4">{request.quantity}</td>
                  <td className="p-4">
                    <Badge variant="outline">
                      {request.type === 'existing' ? 'Existing Product' : 'New Product'}
                    </Badge>
                  </td>
                  <td className="p-4">{getStatusBadge(request.status)}</td>
                  <td className="p-4">{request.requestDate}</td>
                  <td className="p-4">{request.expectedDelivery}</td>
                  <td className="p-4">
                    <Badge variant={request.urgency === 'high' ? 'destructive' : 'default'}>
                      {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Restock Request</DialogTitle>
            </DialogHeader>

            <Tabs value={requestType} onValueChange={setRequestType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Product</TabsTrigger>
                <TabsTrigger value="new">New Product</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Select Product</Label>
                    <Select
                      value={formData.productId}
                      onValueChange={(value) => setFormData({...formData, productId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} (Current Stock: {product.currentStock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={formData.productName}
                      onChange={(e) => setFormData({...formData, productName: e.target.value})}
                      placeholder="Enter new product name"
                    />
                  </div>
                  <div>
                    <Label>Product Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid gap-4 py-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="Enter quantity needed"
                />
              </div>

              <div>
                <Label>Delivery Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter delivery address"
                />
              </div>

              <div>
                <Label>Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({...formData, urgency: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                  placeholder="Any additional information"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RestockRequestPage;