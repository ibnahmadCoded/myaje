import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-green-50/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        <p className="text-stone-600 font-medium text-lg animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}