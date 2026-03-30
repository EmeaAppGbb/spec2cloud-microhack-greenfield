'use client';

interface PlanFieldConfig {
  key: string;
  dataField: string;
  label: string;
  isList?: boolean;
}

/**
 * Ordered list of plan fields to display. Only fields present in the data
 * will be rendered. The data-field attribute matches the e2e test expectations.
 */
const PLAN_FIELDS: PlanFieldConfig[] = [
  { key: 'campaignName', dataField: 'campaign-name', label: 'Campaign Name' },
  { key: 'objective', dataField: 'objective', label: 'Objective' },
  { key: 'targetAudience', dataField: 'target-audience', label: 'Target Audience' },
  { key: 'platform', dataField: 'platform', label: 'Platform' },
  { key: 'tone', dataField: 'tone', label: 'Tone' },
  { key: 'visualDirection', dataField: 'visual-direction', label: 'Visual Direction' },
  { key: 'keyMessages', dataField: 'key-messages', label: 'Key Messages', isList: true },
  { key: 'timeline', dataField: 'timeline', label: 'Timeline' },
  { key: 'budget', dataField: 'budget', label: 'Budget' },
];

interface PlanBlockProps {
  data: Record<string, unknown>;
}

export default function PlanBlock({ data }: PlanBlockProps) {
  return (
    <div
      data-testid="plan-block"
      className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          📋 Campaign Plan
        </h3>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {PLAN_FIELDS.map((field) => {
          const value = data[field.key];
          if (value === undefined || value === null || value === '') return null;

          return (
            <div key={field.dataField} className="px-4 py-2.5">
              <dt className="mb-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide dark:text-gray-400">
                {field.label}
              </dt>
              <dd data-field={field.dataField} className="text-sm text-gray-900 dark:text-gray-100">
                {field.isList && Array.isArray(value) ? (
                  <ol className="list-decimal list-inside space-y-0.5">
                    {(value as string[]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          );
        })}
      </div>
    </div>
  );
}
