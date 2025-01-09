import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiBaseUrl } from '@/config';

export const CheckoutDialog = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onCheckoutComplete 
}) => {

  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [checkoutMode, setCheckoutMode] = useState("payment"); // "payment" or "invoice"
  
  // Form state
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    payment_method: "card",
  });

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) return "Name is required";
    if (!formData.customer_email.trim()) return "Email is required";
    if (!formData.customer_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Invalid email format";
    if (!formData.shipping_address.trim()) return "Shipping address is required";
    return null;
  };

  const handleSubmitInvoiceRequest = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const invoiceData = {
        order_type: "invoice",
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: formData.shipping_address,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        amount: total,
        status: "pending"
      };

      const response = await fetch(`${apiBaseUrl}/orders/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit invoice request');
      }
      
      setShowConfirmation(true);
      onClose();
    } catch (error) {
      console.error('Invoice request error:', error);
      setError(error.message || 'Failed to submit invoice request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (checkoutMode === "invoice") {
      await handleSubmitInvoiceRequest();
      return;
    }

    // Original payment processing logic...
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const orderData = {
        order_type: "payment",
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: formData.shipping_address,
        items: orderItems,
        payment_info: {
          method: formData.payment_method,
          timestamp: new Date().toISOString(),
          amount: total
        }
      };

      const response = await fetch(`${apiBaseUrl}/orders/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit order');
      }

      setShowConfirmation(true);
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Please confirm the products before checkout</DialogDescription>
          
          <Tabs value={checkoutMode} onValueChange={setCheckoutMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment">Make Payment</TabsTrigger>
              <TabsTrigger value="invoice">Request Invoice</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Customer Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="customer_name">Full Name *</Label>
                    <Input
                      id="customer_name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Email Address *</Label>
                    <Input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone Number</Label>
                    <Input
                      id="customer_phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_address">Shipping Address *</Label>
                    <Textarea
                      id="shipping_address"
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      placeholder="Enter your complete shipping address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold">Order Summary</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method - Only show for payment mode */}
              {checkoutMode === "payment" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Method</h3>
                  <RadioGroup
                    value={formData.payment_method} // This is the selected payment method
                    onChange={(value) =>
                      handleInputChange({ target: { name: "payment_method", value } })
                    }
                  >
                    <RadioGroupItem
                      label="Credit/Debit Card"
                      value="card"
                      selectedValue={formData.payment_method}
                    />
                    <RadioGroupItem
                      label="Bank Transfer"
                      value="bank_transfer"
                      selectedValue={formData.payment_method}
                    />
                  </RadioGroup>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                onClick={handleSubmitOrder}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : checkoutMode === "payment" ? 'Place Order' : 'Request Invoice'}
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {checkoutMode === "payment" ? 
                "Order Submitted Successfully!" : 
                "Invoice Request Submitted!"
              }
            </DialogTitle>
            <DialogDescription>
              {checkoutMode === "payment" ? 
                "Your order has been submitted successfully. You will receive a confirmation email with your order details shortly." :
                "Your invoice request has been submitted successfully. Our team will generate the invoice and send it to your email shortly."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setShowConfirmation(false);
              onCheckoutComplete();
            }}>
              Continue Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CheckoutDialog;