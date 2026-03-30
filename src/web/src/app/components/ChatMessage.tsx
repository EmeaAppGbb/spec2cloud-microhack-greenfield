'use client';

import Markdown from 'react-markdown';
import type { ChatMessage as ChatMessageType, CreativeAssets } from '@campaign/shared';
import PlanBlock from './PlanBlock';
import CreativePreview from './CreativePreview';
import StatusMessage from './StatusMessage';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isPlan = message.metadata?.messageType === 'plan';
  const isCreativePreview = message.metadata?.messageType === 'creative-preview';
  const isStatus = message.metadata?.messageType === 'status';
  const isError = message.metadata?.messageType === 'error';

  const testId = isUser ? 'user-message' : 'assistant-message';

  // Status messages get lightweight treatment — no bubble wrapper
  if (isStatus && message.content) {
    return (
      <div data-testid={testId} className="flex justify-start mb-3">
        <div className="max-w-[80%]">
          <StatusMessage message={message.content} />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white'
            : isError
              ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
              : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
        }`}
      >
        {isPlan && message.metadata?.structuredData ? (
          <PlanBlock data={message.metadata.structuredData as Record<string, unknown>} />
        ) : isCreativePreview && message.metadata?.structuredData ? (
          <CreativePreview
            {...(message.metadata.structuredData as CreativeAssets)}
          />
        ) : message.content ? (
          <Markdown
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            }}
          >
            {message.content}
          </Markdown>
        ) : null}
      </div>
    </div>
  );
}
