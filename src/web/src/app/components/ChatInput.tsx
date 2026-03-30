'use client';

import { useState, useCallback } from 'react';
import { useCampaign } from '../context/CampaignContext';

export default function ChatInput() {
  const { state, submitBrief } = useCampaign();
  const [inputValue, setInputValue] = useState('');

  const isButtonDisabled = inputValue.trim().length === 0 || state.isProcessing;

  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const accepted = await submitBrief(inputValue);
    if (accepted) {
      setInputValue('');
    }
  }, [inputValue, submitBrief]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (inputValue.trim()) {
          handleSubmit();
        }
      }
    },
    [inputValue, handleSubmit],
  );

  return (
    <div className="border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      {/* Validation message */}
      {state.validationError && (
        <div
          data-testid="validation-message"
          className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800"
          role="alert"
        >
          {state.validationError}
        </div>
      )}

      {/* Truncation notification */}
      {state.truncationNotice && (
        <div
          data-testid="truncation-notification"
          className="mb-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800"
          role="status"
        >
          {state.truncationNotice}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          data-testid="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={state.isProcessing}
          placeholder="Describe your campaign idea…"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm
                     placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                     focus:outline-none disabled:cursor-not-allowed disabled:opacity-50
                     dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        <button
          data-testid="send-button"
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                     hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                     focus:outline-none disabled:cursor-not-allowed disabled:opacity-50
                     dark:focus:ring-offset-gray-900"
        >
          Send
        </button>
      </div>
    </div>
  );
}
