'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { Share2, ArrowLeft } from 'lucide-react';
import MarketplaceView from '@/components/Marketplace';
import { apiBaseUrl } from '@/config';

const StorePage = (props) => {
  const params = use(props.params);
  const { slug } = params;

  const [storeData, setStoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/marketplace/store/${slug}`);
        if (!response.ok) throw new Error('Failed to fetch store data');
        const data = await response.json();
        setStoreData(data);
      } catch (error) {
        console.error('Error fetching store data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: storeData?.store?.name,
        text: storeData?.store?.tagline,
        url: window.location.href,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Store Banner */}
      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{storeData?.store?.name}</h1>
            <p className="text-xl opacity-90 mb-4">{storeData?.store?.tagline}</p>
            <div className="text-sm opacity-80">
              <p>{storeData?.store?.address}</p>
              <p>Phone: {storeData?.store?.phone} | Email: {storeData?.store?.email}</p>
            </div>
          </div>
        </div>
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-100 rounded-full shadow-lg text-gray-800 font-medium transition-all duration-200"
        >
          <Share2 size={20} />
          <span>Share Store</span>
        </button>
        {/* Back Button */}
        <button
          onClick={() => (window.location.href = '/')}
          className="absolute bottom-4 left-4 flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-100 rounded-full shadow-lg text-gray-800 font-medium transition-all duration-200"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      {/* Products Section */}
      <MarketplaceView 
        products={storeData?.products || []} 
        isStorePage={true}
      />
    </div>
  );
};

export default StorePage;
