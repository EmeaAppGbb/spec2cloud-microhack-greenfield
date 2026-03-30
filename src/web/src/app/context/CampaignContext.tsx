'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  ChatMessage,
  StageStatus,
  CampaignStage,
} from '@campaign/shared';
import { BRIEF_MIN_LENGTH, BRIEF_MAX_LENGTH, CAMPAIGN_STAGES, STAGE_LABELS } from '@campaign/shared';

// Re-export for components
export { CAMPAIGN_STAGES, STAGE_LABELS };
export type { CampaignStage };

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface CampaignState {
  messages: ChatMessage[];
  stages: Record<CampaignStage, StageStatus>;
  isProcessing: boolean;
  campaignId: string | null;
  validationError: string | null;
  truncationNotice: string | null;
  streamingMessageId: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type CampaignAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'UPDATE_STAGE'; payload: { stage: CampaignStage; status: StageStatus } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_CAMPAIGN_ID'; payload: string }
  | { type: 'SET_VALIDATION_ERROR'; payload: string | null }
  | { type: 'SET_TRUNCATION_NOTICE'; payload: string | null }
  | { type: 'SET_STREAMING_MESSAGE_ID'; payload: string | null }
  | { type: 'APPEND_TOKEN'; payload: { messageId: string; token: string } };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function createInitialStages(): Record<CampaignStage, StageStatus> {
  const stages = {} as Record<CampaignStage, StageStatus>;
  for (const stage of CAMPAIGN_STAGES) {
    stages[stage] = 'pending';
  }
  return stages;
}

const initialState: CampaignState = {
  messages: [],
  stages: createInitialStages(),
  isProcessing: false,
  campaignId: null,
  validationError: null,
  truncationNotice: null,
  streamingMessageId: null,
};

function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id
            ? {
                ...m,
                ...action.payload.updates,
                metadata: action.payload.updates.metadata
                  ? { ...m.metadata, ...action.payload.updates.metadata }
                  : m.metadata,
              }
            : m,
        ),
      };

    case 'UPDATE_STAGE':
      return {
        ...state,
        stages: { ...state.stages, [action.payload.stage]: action.payload.status },
      };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_CAMPAIGN_ID':
      return { ...state, campaignId: action.payload };

    case 'SET_VALIDATION_ERROR':
      return { ...state, validationError: action.payload };

    case 'SET_TRUNCATION_NOTICE':
      return { ...state, truncationNotice: action.payload };

    case 'SET_STREAMING_MESSAGE_ID':
      return { ...state, streamingMessageId: action.payload };

    case 'APPEND_TOKEN':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, content: m.content + action.payload.token }
            : m,
        ),
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CampaignContextValue {
  state: CampaignState;
  dispatch: React.Dispatch<CampaignAction>;
  addMessage: (msg: ChatMessage) => void;
  updateStage: (stage: CampaignStage, status: StageStatus) => void;
  setProcessing: (value: boolean) => void;
  /** Returns true when the brief passed local validation and was submitted. */
  submitBrief: (brief: string) => Promise<boolean>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error('useCampaign must be used within CampaignProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, initialState);

  const addMessage = useCallback((msg: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: msg });
  }, []);

  const updateStage = useCallback((stage: CampaignStage, status: StageStatus) => {
    dispatch({ type: 'UPDATE_STAGE', payload: { stage, status } });
  }, []);

  const setProcessing = useCallback((value: boolean) => {
    dispatch({ type: 'SET_PROCESSING', payload: value });
  }, []);

  const submitBrief = useCallback(async (brief: string): Promise<boolean> => {
    // Clear previous notices
    dispatch({ type: 'SET_VALIDATION_ERROR', payload: null });
    dispatch({ type: 'SET_TRUNCATION_NOTICE', payload: null });

    // Validate minimum length
    if (brief.trim().length < BRIEF_MIN_LENGTH) {
      dispatch({
        type: 'SET_VALIDATION_ERROR',
        payload: `Brief is too short. Please provide at least ${BRIEF_MIN_LENGTH} characters.`,
      });
      return false;
    }

    // Handle truncation
    let submittedBrief = brief;
    let wasTruncated = false;
    if (brief.length > BRIEF_MAX_LENGTH) {
      submittedBrief = brief.slice(0, BRIEF_MAX_LENGTH);
      wasTruncated = true;
      dispatch({
        type: 'SET_TRUNCATION_NOTICE',
        payload: `Your brief was truncated to ${BRIEF_MAX_LENGTH} characters.`,
      });
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: brief,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });

    // Enter processing state
    dispatch({ type: 'SET_PROCESSING', payload: true });

    // Create assistant streaming placeholder
    const assistantId = generateMessageId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      metadata: { agentName: 'planner', streamingComplete: false },
    };
    dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });
    dispatch({ type: 'SET_STREAMING_MESSAGE_ID', payload: assistantId });

    // Transition planning stage to active
    dispatch({ type: 'UPDATE_STAGE', payload: { stage: 'planning', status: 'active' } });

    try {
      const res = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: submittedBrief }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      dispatch({ type: 'SET_CAMPAIGN_ID', payload: data.campaignId });

      if (data.truncated && !wasTruncated) {
        dispatch({
          type: 'SET_TRUNCATION_NOTICE',
          payload: `Your brief was truncated to ${BRIEF_MAX_LENGTH} characters.`,
        });
      }
    } catch (err) {
      const errMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'An error occurred. Please try again.',
        timestamp: new Date().toISOString(),
        metadata: { messageType: 'error' },
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errMsg });
      dispatch({ type: 'SET_PROCESSING', payload: false });
      dispatch({ type: 'UPDATE_STAGE', payload: { stage: 'planning', status: 'pending' } });
      dispatch({ type: 'SET_STREAMING_MESSAGE_ID', payload: null });
    }

    return true;
  }, []);

  return (
    <CampaignContext.Provider
      value={{ state, dispatch, addMessage, updateStage, setProcessing, submitBrief }}
    >
      {children}
    </CampaignContext.Provider>
  );
}
