import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const CheckoutDialog = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onCheckoutComplete 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    payment_method: "card", // card, bank_transfer, etc.
  });

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(""); // Clear error when user makes changes
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) return "Name is required";
    if (!formData.customer_email.trim()) return "Email is required";
    if (!formData.customer_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Invalid email format";
    if (!formData.shipping_address.trim()) return "Shipping address is required";
    return null;
  };

  const handleSubmitOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Prepare order items in the format expected by the backend
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      // Create marketplace order
      const orderData = {
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

      const response = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit order');
      }

      const result = await response.json();
      setShowConfirmation(true);
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
          
          <div className="space-y-6">
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

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              <RadioGroup
                value={formData.payment_method}
                onValueChange={(value) => handleInputChange({ target: { name: 'payment_method', value }})}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Credit/Debit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer">Bank Transfer</Label>
                </div>
              </RadioGroup>
            </div>

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
              {isProcessing ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Order Submitted Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Your order has been submitted successfully. You will receive a confirmation email with your order details shortly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowConfirmation(false);
              onCheckoutComplete();
            }}>
              Continue Shopping
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};