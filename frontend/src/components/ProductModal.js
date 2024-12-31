'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Store, ShoppingCart, Plus, Minus, Share2, Heart, PackageSearch } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { backendUrl } from '@/config';

// product image SVG
const ProductImagePlaceholder = ({ onClick }) => (
  <div 
    className="aspect-[4/3] w-full h-full relative bg-green-100 rounded-2xl flex items-center justify-center group hover:bg-green-200 transition-colors duration-300 cursor-pointer"
    onClick={onClick}
  >
    <PackageSearch size={48} className="text-green-300 group-hover:scale-110 transition-transform duration-300" />
  </div>
);

export const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishListed, setIsWishListed] = useState(false);
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
      <DialogContent className="min-w-[1200px] h-[97vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-1 md:p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold">{product.name}</DialogTitle>
              <DialogDescription></DialogDescription>
              <Badge variant="outline" className="mt-2">{product.category}</Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsWishListed(!isWishListed)}
                className="rounded-full"
              >
                <Heart 
                  className={`h-5 w-5 ${isWishListed ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:gap-6 h-full">
            {/* Image Section */}
            <div className="md:w-1/2 p-4 md:p-6">
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
              {totalImages > 0 ? (
                  <>
                    <img
                      src={`${backendUrl}/${product.images[currentImageIndex].replace('./', '')}`}
                      alt={`${product.name} - Image ${currentImageIndex + 1}`}
                      className="object-cover w-full h-full"
                    />
                    {/* ... (image navigation buttons remain the same) ... */}
                  </>
                ) : (
                    <ProductImagePlaceholder />
                )}
                
                {totalImages > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-2 hover:bg-white transition-all shadow-lg"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 rounded-full p-2 hover:bg-white transition-all shadow-lg"
                    >
                      <ChevronRight size={24} />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                      {currentImageIndex + 1} / {totalImages}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {totalImages > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 snap-x">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 snap-start transition-all duration-200 ${
                        currentImageIndex === index 
                          ? 'ring-2 ring-green-500 ring-offset-2' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={`${backendUrl}/${image.replace('./', '')}`}
                        alt={`Thumbnail ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-4 md:p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Price</h3>
                <p className="text-3xl font-bold text-green-600">
                  ₦{product.price.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg w-fit">
                  <button
                    onClick={decrementQuantity}
                    className="p-2 rounded-full hover:bg-white transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="p-2 rounded-full hover:bg-white transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Store</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Store size={18} />
                    <span className="font-medium">{product.store}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 mt-auto">
          <div className="flex gap-3">
            <Button 
              onClick={handleAddToCart}
              className="flex-1 h-12 text-lg font-semibold"
              size="lg"
            >
              <ShoppingCart className="mr-2" size={20} />
              Add to Cart
            </Button>
            
            <Button 
              onClick={onClose}
              className="h-12"
              variant="outline"
              size="lg"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;