'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useSSE } from '../hooks/useSSE';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatPanel({ className }: { className?: string }) {
  const { state } = useCampaign();
  useSSE(state.campaignId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  // Detect if user has scrolled up manually
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > 50;
  }, []);

  // Auto-scroll to bottom on new messages (unless user scrolled up)
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages]);

  return (
    <section
      data-testid="chat-panel"
      className={`flex flex-col bg-white dark:bg-gray-900 ${className ?? ''}`}
    >
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        data-testid="chat-messages"
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {state.messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Describe your campaign to get started
          </div>
        )}

        {state.messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput />
    </section>
  );
}
