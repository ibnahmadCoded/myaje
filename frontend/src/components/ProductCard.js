import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { backendUrl } from '@/config';

const ProductImagePlaceholder = ({ onClick }) => (
  <div 
    className="aspect-[4/3] w-full relative bg-gray-100 rounded-2xl flex items-center justify-center group hover:bg-gray-200 transition-colors duration-300 cursor-pointer"
    onClick={onClick}
  >
    <PackageSearch size={48} className="text-gray-300 group-hover:scale-110 transition-transform duration-300" />
  </div>
);

export const ProductCard = ({ product, onAddToCart, showOrderButton = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const totalImages = product?.images?.length || 0;

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % totalImages);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 flex-1">
        <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-2xl">
          {totalImages > 0 ? (
            <div className="w-full h-full relative">
              <img
                src={`${backendUrl}/${product.images[activeIndex].replace('./', '')}`}
                alt={product.name}
                className={`w-full h-full object-cover rounded-2xl transition-transform duration-500 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
              />
              {totalImages > 1 && isHovered && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <ProductImagePlaceholder />
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:line-clamp-none transition-all duration-300">
          {product?.name}
        </h3>
        <div className="text-sm text-gray-600 mb-2">
          {product?.category}
        </div>
      </div>
      <div className="p-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">₦{product?.price?.toLocaleString()}</span>
          <Button
            onClick={() => onAddToCart(product)}
            variant="default"
            size="sm"
          >
            {showOrderButton ? 'Repeat Order' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
};