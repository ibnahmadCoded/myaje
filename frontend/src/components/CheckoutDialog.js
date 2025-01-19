import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiBaseUrl } from '@/config';
import PaystackPop from '@paystack/inline-js'
import { toast } from '@/hooks/use-toast';

const PAYMENT_METHODS = {
  CARD: "card",
  BANK_TRANSFER: "bank_transfer",
  BNPL: "bnpl",
  BORROW: "borrow",
  INSTALLMENT: "installment",
  CASH: "cash"
};

const BNPL_OPTIONS = [
  { value: "bnpl_7", label: "Pay after 7 days" },
  { value: "bnpl_15", label: "Pay after 15 days" },
  { value: "bnpl_30", label: "Pay after 30 days" }
];

const INSTALLMENT_OPTIONS = [
  { value: "installment_2", label: "2 Installments" },
  { value: "installment_3", label: "3 Installments" },
  { value: "installment_4", label: "4 Installments" }
];

export const CheckoutDialog = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onCheckoutComplete 
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [error, setError] = useState("");
    const [checkoutMode, setCheckoutMode] = useState("payment");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS.CARD);
    const [selectedOption, setSelectedOption] = useState("");
    const [activeView, setActiveView] = useState("");
    const [paymentReference, setPaymentReference] = useState(null);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [featureModalType, setFeatureModalType] = useState(null);
    const [userEligibility, setUserEligibility] = useState({
      hasActiveBank: false,
      canLoan: false,
      maxLoanAmount: 0
    });
    
    const [formData, setFormData] = useState({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      shipping_address: ""
    });

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
    // Initialize auth state and fetch eligibility
    useEffect(() => {
      const initializeAuth = async () => {
        if (typeof window === 'undefined') return;

        const userDataStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (userDataStr && token) {
          try {
            const user = JSON.parse(userDataStr);
            setIsAuthenticated(true);
            setActiveView(user.active_view);
            
            // Fetch eligibility right after confirming authentication
            const response = await fetch(`${apiBaseUrl}/payment/eligibility?active_view=${user.active_view}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            if (!response.ok) throw new Error('Failed to fetch eligibility');
            
            const data = await response.json();
            const transformedData = {
              hasActiveBank: data.has_active_bank,
              canLoan: data.can_loan,
              maxLoanAmount: data.max_loan_amount,
            };

            setUserEligibility(transformedData);
          } catch (error) {
            console.error("Error in initialization:", error);
            setError("Failed to load payment options. Please try again.");
          }
        }
      };
  
      if (isOpen) {
        initializeAuth();
      }
    }, [isOpen]); // Only run when dialog opens
  
    // Reset payment method when eligibility changes
    useEffect(() => {
      if (!userEligibility?.hasActiveBank) {
        setSelectedPaymentMethod(PAYMENT_METHODS.CARD);
        setSelectedOption("");
      }
    }, [userEligibility]);

    const handlePaymentMethodSelect = (method) => {
      // Check authentication first for restricted payment methods
      if (!isAuthenticated && [PAYMENT_METHODS.BNPL, PAYMENT_METHODS.INSTALLMENT, PAYMENT_METHODS.BORROW, PAYMENT_METHODS.CARD, PAYMENT_METHODS.BANK_TRANSFER].includes(method)) {
        //setSelectedPaymentMethod(PAYMENT_METHODS.CARD); // Reset to default
        setFeatureModalType('login-required');
        setShowFeatureModal(true);
        //return;
      }
      
      setSelectedPaymentMethod(method);
      setSelectedOption('');
    };
      
    const renderPaymentMethods = () => (
    <RadioGroup
        value={selectedPaymentMethod}
        onChange={handlePaymentMethodSelect}
    >
        <RadioGroupItem 
        value={PAYMENT_METHODS.CARD} 
        label="Credit/Debit Card" 
        />
        
        <RadioGroupItem 
        value={PAYMENT_METHODS.BANK_TRANSFER} 
        label="Bank Transfer" 
        />
    
        {isAuthenticated && userEligibility?.canLoan && (
        <>
            <RadioGroupItem 
            value={PAYMENT_METHODS.BNPL} 
            label="Buy Now, Pay Later" 
            disabled={!userEligibility?.hasActiveBank} 
            />
    
            <RadioGroupItem 
            value={PAYMENT_METHODS.INSTALLMENT} 
            label="Pay in Installments" 
            disabled={!userEligibility?.hasActiveBank} 
            />
    
            <RadioGroupItem 
            value={PAYMENT_METHODS.BORROW} 
            label={`Borrow to Pay (up to ₦${userEligibility?.maxLoanAmount})`} 
            disabled={!userEligibility?.hasActiveBank || userEligibility?.maxLoanAmount < total} 
            />

            <RadioGroupItem 
            value={PAYMENT_METHODS.CASH} 
            label="Cash on Delivery" 
            />
        </>
        )}
    </RadioGroup>
    );

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
    
    if (checkoutMode === "payment") {
      // Additional validation for specific payment methods
      if ([PAYMENT_METHODS.BNPL, PAYMENT_METHODS.BORROW, PAYMENT_METHODS.INSTALLMENT].includes(selectedPaymentMethod)) {
        if (!isAuthenticated) return "You must be logged in to use this payment method";
        if (!userEligibility.hasActiveBank) return "You need an active bank account for this payment method";
      }
      
      if (selectedPaymentMethod === PAYMENT_METHODS.BORROW && total > userEligibility.maxLoanAmount) {
        return `Your maximum loan amount is ₦${userEligibility.maxLoanAmount}`;
      }

      if ([PAYMENT_METHODS.BNPL, PAYMENT_METHODS.INSTALLMENT].includes(selectedPaymentMethod) && !selectedOption) {
        return "Please select a payment option";
      }
    }

    return null;
  };

  const handlePaymentSuccess = async (response) => {
      try {
          setIsProcessing(true);

          if (typeof window === 'undefined') return;
          
          // Verify payment on your backend
          const verifyResponse = await fetch(`${apiBaseUrl}/payment/verify`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  ...(isAuthenticated && { Authorization: `Bearer ${localStorage.getItem("token")}` })
              },
              body: JSON.stringify({
                  reference: response.reference,
                  payment_method: selectedPaymentMethod
              })
          });

          const data = await verifyResponse.json();
          
          if (!verifyResponse.ok) {
              throw new Error(data.detail || 'Payment verification failed');
          }
          
          // Show success message and complete checkout
          setShowConfirmation(true);
          onCheckoutComplete();

          //toast
          toast({
            title: "Success",
            description: "Payment was successful! Thank you for using Myaje. Your order is on its way.",
          });
      } catch (error) {
          console.error('Payment verification error:', error);
          setError(error.message || 'Payment verification failed. Please contact support.');
          toast({
            title: "Error",
            description: "Payment was unsuccessful. Please try again.",
            variant: "destructive",
          });
      } finally {
          setIsProcessing(false);
      }
  };

  const handlePaymentMethod = async () => {
    const validationError = validateForm();
    if (validationError) {
        setError(validationError);
        return;
    }

    if (typeof window !== 'undefined' && !window.PaystackPop) {
      console.error('PaystackPop is not defined. Ensure the Paystack script is correctly loaded.');
      setError("Payment system is not ready. Please try again.");
      return;
  }

    setIsProcessing(true);
    setError("");

    if (typeof window === 'undefined') return;

    try {
        const paymentData = {
            amount: total,
            email: formData.customer_email,
            payment_method: selectedPaymentMethod,
            order_type: "payment",
            customer_info: {
                name: formData.customer_name,
                email: formData.customer_email,
                phone: formData.customer_phone,
                address: formData.shipping_address,
            },
            items: cartItems.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
            })),
        };

        // Handle different payment methods
        let endpoint = `${apiBaseUrl}/payment/initialize`;
        if (selectedPaymentMethod === PAYMENT_METHODS.CASH) {
          endpoint = `${apiBaseUrl}/payment/cash`;
        } else if (selectedPaymentMethod === PAYMENT_METHODS.INSTALLMENT) {
          endpoint = `${apiBaseUrl}/payment/installment`;
          paymentData.installment_option = selectedOption;
        } else if (selectedPaymentMethod === PAYMENT_METHODS.BNPL) {
          endpoint = `${apiBaseUrl}/payment/bnpl`;
        } else if (selectedPaymentMethod === PAYMENT_METHODS.BORROW) {
          endpoint = `${apiBaseUrl}/payment/borrow`;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            ...(isAuthenticated && { Authorization: `Bearer ${localStorage.getItem("token")}` }),
          },
          body: JSON.stringify(paymentData),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || 'Payment initialization failed');

        setPaymentReference(data.reference_number);

        if (typeof window !== 'undefined' && [PAYMENT_METHODS.CARD, PAYMENT_METHODS.BANK_TRANSFER].includes(selectedPaymentMethod)) {
            const paystack = new PaystackPop();
            if (!paystack) {
                throw new Error('Payment system not initialized');
            }

            // Event listener for Paystack events
            window.addEventListener('message', function(event) {          
              // Handle the specific success event format
              if (event.data.event === 'success') {
                  handlePaymentSuccess(event.data.data);
              } 
              else if (event.data.event === 'closed') {
                  handlePaymentClose();
                  setDialogOpen(true);
              }
          });

          try {
              onClose(); // close checkout dialog
              paystack.resumeTransaction(data.access_code);
          } catch (paystackError) {
              console.error('Error resuming Paystack transaction:', paystackError);
              throw paystackError;
          }

        }
    } catch (error) {
        console.error('Payment error:', error);
        setError(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
    } finally {
        setIsProcessing(false);
    }
};

  const handleSubmitInvoiceRequest = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError("");

    if (typeof window === 'undefined') return;

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

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const response = await fetch(`${apiBaseUrl}/orders/submit`, {
        method: 'POST',
        headers: headers,
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
    // For invoice requests, handle separately
    if (checkoutMode === "invoice") {
      await handleSubmitInvoiceRequest();
      return;
    }
  
    // For card and bank transfer payments, use handlePaymentMethod
    if (selectedPaymentMethod === PAYMENT_METHODS.CARD || 
        selectedPaymentMethod === PAYMENT_METHODS.BANK_TRANSFER) {
      await handlePaymentMethod();
      return;
    }
  
    // For other payment methods (BNPL, BORROW, INSTALLMENT)
    // We'll implement this later
    
    // Keeping the validation in case we implement other methods
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
  };

  if(paymentReference){
    //console.log("")
  }

  if(activeView){
    //console.log("")
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your purchase</DialogDescription>
          </DialogHeader>

          <Tabs value={checkoutMode} onValueChange={setCheckoutMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment">Make Payment</TabsTrigger>
              <TabsTrigger value="invoice">Request Invoice</TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="space-y-6">
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

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold">Payment Method</h3>
                {renderPaymentMethods()}

                {selectedPaymentMethod === PAYMENT_METHODS.INSTALLMENT && (
                  <div className="space-y-4">
                    <Select 
                      value={selectedOption} 
                      onValueChange={setSelectedOption}
                      disabled={!userEligibility?.hasActiveBank}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select number of installments" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTALLMENT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedOption && (
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Total amount: ₦{total.toLocaleString()}</p>
                        <p>Each installment: ₦{(total / parseInt(selectedOption)).toLocaleString()}</p>
                        <p>First payment: Due immediately</p>
                        <p>Remaining payments: Every 30 days</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedPaymentMethod === PAYMENT_METHODS.BNPL && (
                  <div className="space-y-4">
                    <Select 
                      value={selectedOption} 
                      onValueChange={setSelectedOption}
                      disabled={!userEligibility?.hasActiveBank}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {BNPL_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedOption && (
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Total amount: ₦{total.toLocaleString()}</p>
                        <p>Payment due in {selectedOption} days</p>
                        <p className="text-xs">Note: Full amount will be due on {
                          new Date(Date.now() + parseInt(selectedOption) * 24 * 60 * 60 * 1000).toLocaleDateString()
                        }</p>
                      </div>
                    )}
                  </div>
                )}
                </div>
            </TabsContent>

            <TabsContent value="invoice" className="space-y-6">
              {/* Customer Information for Invoice */}
              <div className="space-y-4">
                <h3 className="font-semibold">Customer Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="invoice_customer_name">Full Name *</Label>
                    <Input
                      id="invoice_customer_name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice_customer_email">Email Address *</Label>
                    <Input
                      id="invoice_customer_email"
                      name="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice_customer_phone">Phone Number</Label>
                    <Input
                      id="invoice_customer_phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice_shipping_address">Shipping Address *</Label>
                    <Textarea
                      id="invoice_shipping_address"
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      placeholder="Enter your complete shipping address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Confirmation Message */}
          {showConfirmation && (
            <Alert>
              <AlertDescription>
                {checkoutMode === "invoice" 
                  ? "Invoice request submitted successfully! We'll contact you shortly."
                  : "Payment completed successfully! Thank you for your purchase."}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={isProcessing}
            >
              {isProcessing 
                ? "Processing..." 
                : checkoutMode === "invoice" 
                  ? "Request Invoice" 
                  : `Pay ₦${total.toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Feature Modal */}
      <Dialog open={showFeatureModal} onOpenChange={() => setShowFeatureModal(false)}>
        <DialogContent className="sm:max-w-md">
            {featureModalType === 'login-required' && (
                <>
                    <DialogHeader>
                        <DialogTitle>Create an Account to Access More Features</DialogTitle>
                        <DialogDescription>
                            Sign up to unlock exclusive payment options including:
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4 space-y-3">
                        {[
                            "Buy Now, Pay Later - Flexible payment timeline",
                            "Installment Plans - Split your payments",
                            "Instant Loans - Quick access to funds",
                            "Cash on Delivery - Pay Cash upon product delivery",
                            "Personalized Shopping Experience",
                            "Order Tracking"
                        ].map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                                <p className="text-sm text-muted-foreground">{feature}</p>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setShowFeatureModal(false)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                          setShowFeatureModal(false);

                          // Ensure this only runs on the client-side
                          if (typeof window !== 'undefined') {
                              window.location.href = '/register';
                          }
                      }}>
                          Create Account
                      </Button>
                    </DialogFooter>
                </>
            )}
        </DialogContent>
    </Dialog>

    </>
  );
};

export default CheckoutDialog;