import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/app/providers/cart-provider';

export const CartDialog = ({ isOpen, onClose, onCheckout }) => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle>Shopping Cart</DialogTitle>
        <DialogDescription>This is your shopping cart</DialogDescription>

        <div className="py-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Your cart is empty
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">₦{item.price.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.cartId, (item.quantity || 1) - 1)}
                        disabled={(item.quantity || 1) <= 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center">{item.quantity || 1}</span>
                      <button
                        onClick={() => updateQuantity(item.cartId, (item.quantity || 1) + 1)}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="p-1 rounded hover:bg-red-50 text-red-500 ml-2"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">₦{total.toLocaleString()}</span>
                </div>
                <Button 
                  onClick={onCheckout}
                  className="w-full"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};