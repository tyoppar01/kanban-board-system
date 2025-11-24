'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // redirect to board if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/board');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSuccess = () => {
    router.push('/board');
  };

  // show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Don't render auth forms if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Kanban</h1>
          <p className="text-gray-600">Manage your tasks efficiently</p>
        </div>

        {view === 'login' ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}
