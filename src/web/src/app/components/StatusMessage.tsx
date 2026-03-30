'use client';

interface StatusMessageProps {
  message: string;
}

export default function StatusMessage({ message }: StatusMessageProps) {
  return (
    <div
      data-testid="status-message"
      className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-500 dark:bg-gray-800/50 dark:text-gray-400"
    >
      {/* Animated spinner */}
      <svg
        className="h-4 w-4 animate-spin text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
