'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  function fetchProfile() {
    setLoading(true);
    setError(false);
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  }

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p data-testid="profile-loading" className="text-gray-600">Loading profile…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600">Failed to load profile. Please try again.</p>
        <button
          onClick={fetchProfile}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 data-testid="profile-heading" className="mb-4 text-2xl font-bold text-gray-900">Profile</h1>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Username</div>
            <div data-testid="profile-username" className="text-gray-900">{user.username}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Role</div>
            <span data-testid="profile-role" className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {user.role}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Member since</div>
            <div data-testid="profile-created-at" className="text-gray-900">{formatDate(user.createdAt)}</div>
          </div>
        </div>
        <div className="mt-6">
          <button
            data-testid="profile-logout-btn"
            onClick={handleLogout}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
