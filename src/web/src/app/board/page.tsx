'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BoardPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        setAuthenticated(res.ok);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  if (authenticated === null) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Board</h1>
        <p className="text-gray-600">Board coming soon</p>
      </div>
    </main>
  );
}
