'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => setAuthenticated(res.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">TaskBoard</h1>
      <p className="mb-8 max-w-md text-lg text-gray-600">
        A personal task management board. Track your work with ease.
      </p>
      {authenticated === true && (
        <Link
          href="/board"
          data-testid="hero-board-btn"
          className="rounded bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          Go to Board
        </Link>
      )}
      {authenticated === false && (
        <div className="flex gap-4">
          <Link
            href="/login"
            data-testid="hero-login-btn"
            className="rounded bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/register"
            data-testid="hero-register-btn"
            className="rounded border border-blue-600 px-6 py-2.5 font-medium text-blue-600 hover:bg-blue-50"
          >
            Register
          </Link>
        </div>
      )}
    </main>
  );
}
