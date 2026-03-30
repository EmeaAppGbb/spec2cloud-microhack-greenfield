'use client';

import type { StageStatus, CampaignStage } from '@campaign/shared';

interface TimelineStageProps {
  stageId: CampaignStage;
  label: string;
  status: StageStatus;
  isLast: boolean;
}

export default function TimelineStage({ stageId, label, status, isLast }: TimelineStageProps) {
  return (
    <div
      data-testid={`timeline-stage-${stageId}`}
      data-status={status}
      className="relative flex items-start gap-3 pb-6 last:pb-0"
    >
      {/* Connector line */}
      {!isLast && (
        <div
          className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 ${
            status === 'completed' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        />
      )}

      {/* Status circle */}
      <div className="relative z-10 flex-shrink-0">
        {status === 'completed' ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : status === 'active' ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 shadow-sm shadow-blue-300 dark:shadow-blue-800">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800" />
        )}
      </div>

      {/* Label */}
      <span
        className={`pt-0.5 text-sm ${
          status === 'active'
            ? 'font-semibold text-blue-600 dark:text-blue-400'
            : status === 'completed'
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
