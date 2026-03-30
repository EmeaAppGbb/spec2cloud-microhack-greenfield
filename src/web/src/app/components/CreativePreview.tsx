'use client';

interface CreativePreviewProps {
  imageUrl: string;
  caption: string;
  hashtags: string[];
  iterationVersion: number;
}

export default function CreativePreview({
  imageUrl,
  caption,
  hashtags,
  iterationVersion,
}: CreativePreviewProps) {
  return (
    <div
      data-testid="creative-preview"
      className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          🎨 Creative v{iterationVersion}
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Generated image — unoptimized: dynamic external URLs from image generation API */}
        <div className="relative overflow-hidden rounded-md" style={{ maxWidth: 400 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-testid="generated-image"
            src={imageUrl}
            alt={`Campaign creative v${iterationVersion}`}
            className="w-full rounded-md object-cover"
          />
        </div>

        {/* Caption with character count */}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Caption
            </dt>
            <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300">
              {caption.length} chars
            </span>
          </div>
          <dd
            data-testid="caption-text"
            className="text-sm leading-relaxed text-gray-900 dark:text-gray-100"
          >
            {caption}
          </dd>
        </div>

        {/* Hashtags as pills */}
        <div>
          <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Hashtags
          </dt>
          <dd
            data-testid="hashtag-list"
            className="flex flex-wrap gap-1.5"
          >
            {hashtags.map((tag) => (
              <span
                key={tag}
                data-testid="hashtag-chip"
                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </dd>
        </div>
      </div>
    </div>
  );
}
