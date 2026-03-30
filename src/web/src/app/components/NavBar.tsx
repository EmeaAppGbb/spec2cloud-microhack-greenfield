import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <Link href="/" className="text-lg font-semibold text-gray-900">
        spec2cloud
      </Link>
    </nav>
  );
}
