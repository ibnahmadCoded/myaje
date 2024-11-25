import { Brain } from 'lucide-react';

const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Brain className="h-8 w-8 text-green-700" />
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-400 rounded-full animate-pulse" />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
        Myaje
      </span>
    </div>
  );
  
  export default Logo;
  