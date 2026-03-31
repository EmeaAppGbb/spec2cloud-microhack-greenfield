'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: string;
}

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) setUser({ username: data.username, role: data.role });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/login');
  }

  return (
    <nav data-testid="navbar" className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <Link href="/" data-testid="nav-logo" className="text-xl font-bold text-gray-900">
        TaskBoard
      </Link>
      {!loading && (
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/board" data-testid="nav-board" className="text-gray-700 hover:text-gray-900">
                Board
              </Link>
              <Link href="/profile" data-testid="nav-profile" className="text-gray-700 hover:text-gray-900">
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" data-testid="nav-admin" className="text-gray-700 hover:text-gray-900">
                  Admin
                </Link>
              )}
              <button
                data-testid="nav-logout"
                onClick={handleLogout}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" data-testid="nav-login" className="text-gray-700 hover:text-gray-900">
                Login
              </Link>
              <Link href="/register" data-testid="nav-register" className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
