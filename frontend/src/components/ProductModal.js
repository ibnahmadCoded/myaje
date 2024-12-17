'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Store, ShoppingCart, Plus, Minus } from 'lucide-react';

export const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const totalImages = product?.images?.length || 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity });
    setQuantity(1);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-semibold">{product.name}</DialogTitle>
          <DialogDescription>Here are the product details for {product.description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6 p-6 h-full overflow-hidden">
          {/* Image Section */}
          <div className="md:w-1/2 flex flex-col gap-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg">
              <img
                src={`http://localhost:8000/${product.images[currentImageIndex].replace('./', '')}`}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                className="object-cover w-full h-full rounded-lg"
              />
              
              {totalImages > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {totalImages}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {totalImages > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 ${
                      currentImageIndex === index ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <img
                      src={`http://localhost:8000/${image.replace('./', '')}`}
                      alt={`Thumbnail ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 flex flex-col h-full overflow-y-auto">
            <div className="space-y-6 flex-grow">
              <div>
                <h3 className="text-lg font-semibold mb-2">Price</h3>
                <p className="text-3xl font-bold text-green-600">
                  ₦{product.price.toLocaleString()}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Quantity</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={decrementQuantity}
                    className="p-2 rounded-full hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Category</h3>
                <p className="text-gray-600">{product.category}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Store</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Store size={20} />
                  <span>{product.store}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600 text-lg">{product.description}</p>
              </div>
            </div>

            <div className="pt-6 space-y-4 mt-auto border-t">
              <Button 
                onClick={handleAddToCart}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <ShoppingCart className="mr-2" size={20} />
                Add to Cart
              </Button>
              
              <Button 
                onClick={onClose}
                className="w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};