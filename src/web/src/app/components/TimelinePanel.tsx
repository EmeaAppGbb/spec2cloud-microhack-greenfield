'use client';

import { useCampaign, CAMPAIGN_STAGES, STAGE_LABELS } from '../context/CampaignContext';
import TimelineStage from './TimelineStage';

export default function TimelinePanel({ className }: { className?: string }) {
  const { state } = useCampaign();

  return (
    <aside
      data-testid="timeline-panel"
      className={`flex flex-col bg-gray-50 dark:bg-gray-950 ${className ?? ''}`}
    >
      <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Campaign Timeline
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {CAMPAIGN_STAGES.map((stageId, idx) => (
          <TimelineStage
            key={stageId}
            stageId={stageId}
            label={STAGE_LABELS[stageId]}
            status={state.stages[stageId]}
            isLast={idx === CAMPAIGN_STAGES.length - 1}
          />
        ))}
      </div>
    </aside>
  );
}
