'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      router.push('/');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-700">{user.username}</p>
        {user.lastLogin && (
          <p className="text-xs text-gray-500">
            Last login: {new Date(user.lastLogin).toLocaleDateString()}
          </p>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
