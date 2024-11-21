'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Password validation criteria
  const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasCapital = /[A-Z]/.test(password);

    return (
      password.length >= minLength &&
      hasNumber &&
      hasSpecial &&
      hasCapital
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic email validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(formData.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Password validation
    if (!validatePassword(formData.password)) {
      setError('Invalid password format');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rememberMe })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // save token in local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50/40 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input
                type="email"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-300 disabled:opacity-50 focus:outline-none"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input
                type="password"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-300 disabled:opacity-50 focus:outline-none"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
                minLength={8}
              />
            </div>
            <div className="text-xs text-stone-500 mt-1">
              Password must contain at least 8 characters, including:
              <ul className="list-disc list-inside mt-1">
                <li>One uppercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                disabled={isLoading}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-stone-600">
                Remember me
              </label>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => router.push('/reset-password')}
              className="text-sm text-amber-600 hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-200 rounded disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-100 text-stone-600 py-2 rounded-lg hover:bg-green-200 transition-colors focus:ring-2 focus:ring-green-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-stone-500">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-stone-600">
            Don't have an account?{' '}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => router.push('/register')}
              className="text-amber-600 hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-200 rounded disabled:opacity-50"
            >
              Sign up here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}