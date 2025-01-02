'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Check, X, Loader2, Building2, Phone } from 'lucide-react';
import { apiBaseUrl } from '@/config';

export default function Register() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [accountType, setAccountType] = useState('personal');
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      business_name: '',
      phone: ''
    });

    // Password strength criteria
    const [passwordCriteria, setPasswordCriteria] = useState({
      length: false,
      number: false,
      special: false,
      capital: false
    });

    // Email validation pattern
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    // Phone number validation pattern
    const phonePattern = /^\+?[1-9]\d{1,14}$/;

    // Memoized password strength calculation
    const calculatePasswordStrength = useCallback((password) => {
      const criteria = {
        length: password.length >= 8,
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        capital: /[A-Z]/.test(password)
      };
      return Object.values(criteria).filter(Boolean).length;
    }, []);

    // Update password criteria when password changes
    useEffect(() => {
      const criteria = {
        length: formData.password.length >= 8,
        number: /\d/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        capital: /[A-Z]/.test(formData.password)
      };
      setPasswordCriteria(criteria);
    }, [formData.password]);

    const getPasswordStrengthColor = useCallback((strength) => {
      switch (strength) {
        case 0:
        case 1:
          return 'bg-red-500';
        case 2:
          return 'bg-orange-500';
        case 3:
          return 'bg-yellow-500';
        case 4:
          return 'bg-green-500';
        default:
          return 'bg-gray-200';
      }
    }, []);

    const PasswordCriteriaItem = useCallback(({ met, text }) => (
      <div className="flex items-center gap-2 text-sm">
        {met ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <X className="w-4 h-4 text-red-500" />
        )}
        <span className={met ? 'text-green-700' : 'text-red-700'}>
          {text}
        </span>
      </div>
    ), []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      if (!emailPattern.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      const passwordStrength = calculatePasswordStrength(formData.password);
      if (passwordStrength < 3) {
        setError('Please create a stronger password');
        return;
      }

      if (!acceptedTerms) {
        setError('Please accept the terms and conditions');
        return;
      }

      if (accountType === 'business' && !formData.business_name.trim()) {
        setError('Business name is required for business accounts');
        return;
      }

      if (!phonePattern.test(formData.phone.replace(/\D/g, ''))) {
        setError('Please enter a valid phone number');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`${apiBaseUrl}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            account_type: accountType
          })
        });
        
        if (response.ok) {
          router.push('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        console.error('Registration failed:', error);
        setError('An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    const handleInputChange = useCallback((e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }, []);

    return (
      <div className="min-h-screen bg-green-50/40 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-stone-800 mb-6">Register</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-stone-600 mb-2">
                    Account Type
                </label>
                <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-200 focus:border-green-300"
                >
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                </select>
            </div>

            {/* Business Name - Only show for business accounts */}
            {accountType === 'business' && (
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Business Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                  <input
                    type="text"
                    name="business_name"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-300 disabled:opacity-50 focus:outline-none"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    placeholder="Enter business name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-300 disabled:opacity-50 focus:outline-none"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="tel"
                  name="phone"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-300 disabled:opacity-50 focus:outline-none"
                  value={formData.phone}
                  onChange={(e) => {
                    // Basic phone number formatting
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 0) {
                      if (value.length <= 3) {
                        value = value;
                      } else if (value.length <= 6) {
                        value = value.slice(0, 3) + '-' + value.slice(3);
                      } else {
                        value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
                      }
                    }
                    handleInputChange({
                      target: {
                        name: 'phone',
                        value: value
                      }
                    });
                  }}
                  placeholder="703-725-3503"
                  maxLength={12}
                />
              </div>
              <span className="text-xs text-stone-500 mt-1">Format: 123-456-7890</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-300 disabled:opacity-50 focus:outline-none"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Choose a password"
                />
              </div>
              
              <div className="mt-2 space-y-2">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      getPasswordStrengthColor(calculatePasswordStrength(formData.password))
                    }`}
                    style={{ width: `${(calculatePasswordStrength(formData.password) / 4) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <PasswordCriteriaItem met={passwordCriteria.length} text="At least 8 characters" />
                  <PasswordCriteriaItem met={passwordCriteria.number} text="Contains a number" />
                  <PasswordCriteriaItem met={passwordCriteria.capital} text="Contains uppercase" />
                  <PasswordCriteriaItem met={passwordCriteria.special} text="Contains special char" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                disabled={isLoading}
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="terms" className="text-sm text-stone-600">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => window.open('/terms', '_blank')}
                  className="text-green-600 hover:text-green-700 hover:underline focus:outline-none focus:ring-2 focus:ring-green-200 rounded"
                >
                  terms and conditions
                </button>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="w-full bg-green-100 text-stone-600 py-2 rounded-lg hover:bg-green-200 transition-colors focus:ring-2 focus:ring-green-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </button>

            <p className="text-center text-sm text-stone-600">
              Already have an account?{' '}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => router.push('/login')}
                className="text-green-600 hover:text-green-700 hover:underline focus:outline-none focus:ring-2 focus:ring-green-200 rounded disabled:opacity-50"
              >
                Login here
              </button>
            </p>
          </form>
        </div>
      </div>
    );
}