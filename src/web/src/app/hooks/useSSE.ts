'use client';

import { useEffect, useRef } from 'react';
import type { CampaignStage, StageStatus, ChatMessage } from '@campaign/shared';
import { useCampaign, generateMessageId } from '../context/CampaignContext';

/**
 * SSE client hook — connects to the campaign streaming endpoint and
 * dispatches events (tokens, structured data, stage transitions, etc.)
 * into the CampaignContext.
 */
export function useSSE(campaignId: string | null): void {
  const { dispatch, state } = useCampaign();
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingIdRef = useRef<string | null>(null);

  // Keep the ref in sync so event handlers always see current value
  useEffect(() => {
    streamingIdRef.current = state.streamingMessageId;
  }, [state.streamingMessageId]);

  useEffect(() => {
    if (!campaignId) return;

    // Avoid duplicate connections
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/campaign/${campaignId}/stream`);
    eventSourceRef.current = es;

    // --- token: append to streaming assistant message ----------------------
    es.addEventListener('token', ((e: Event) => {
      const me = e as MessageEvent;
      try {
        const data = JSON.parse(me.data as string) as { token: string; agentId: string };
        const msgId = streamingIdRef.current;
        if (msgId && data.token) {
          dispatch({ type: 'APPEND_TOKEN', payload: { messageId: msgId, token: data.token } });
        }
      } catch { /* ignore parse errors */ }
    }) as EventListener);

    // --- structured: deliver plan block or other structured data -----------
    es.addEventListener('structured', ((e: Event) => {
      const me = e as MessageEvent;
      try {
        const data = JSON.parse(me.data as string) as { type: string; data: unknown };
        if (data.type === 'plan' && data.data) {
          const planMsg: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            metadata: {
              messageType: 'plan',
              structuredData: data.data,
              agentName: 'planner',
            },
          };
          dispatch({ type: 'ADD_MESSAGE', payload: planMsg });
        }
      } catch { /* ignore parse errors */ }
    }) as EventListener);

    // --- stage-transition: update timeline --------------------------------
    es.addEventListener('stage-transition', ((e: Event) => {
      const me = e as MessageEvent;
      try {
        const data = JSON.parse(me.data as string) as {
          stage: CampaignStage;
          status: StageStatus;
        };
        if (data.stage) {
          dispatch({ type: 'UPDATE_STAGE', payload: { stage: data.stage, status: data.status } });
        }
      } catch { /* ignore parse errors */ }
    }) as EventListener);

    // --- status: informational messages -----------------------------------
    es.addEventListener('status', ((e: Event) => {
      const me = e as MessageEvent;
      try {
        const data = JSON.parse(me.data as string) as { message: string; agentId: string };
        if (data.message) {
          const statusMsg: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date().toISOString(),
            metadata: { messageType: 'status', agentName: data.agentId },
          };
          dispatch({ type: 'ADD_MESSAGE', payload: statusMsg });
        }
      } catch { /* ignore parse errors */ }
    }) as EventListener);

    // --- complete: agent finished, optional handoff -----------------------
    es.addEventListener('complete', ((e: Event) => {
      const me = e as MessageEvent;
      try {
        const data = JSON.parse(me.data as string) as {
          agentId: string;
          nextAgent?: string;
        };

        // Mark streaming message as complete
        if (streamingIdRef.current) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              id: streamingIdRef.current,
              updates: { metadata: { streamingComplete: true, agentName: data.agentId } },
            },
          });
          dispatch({ type: 'SET_STREAMING_MESSAGE_ID', payload: null });
        }

        // Handoff message when there is a next agent
        if (data.nextAgent) {
          const handoffMsg: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: 'Starting creative generation\u2026',
            timestamp: new Date().toISOString(),
            metadata: { messageType: 'status', agentName: data.nextAgent },
          };
          dispatch({ type: 'ADD_MESSAGE', payload: handoffMsg });
        }

        if (!data.nextAgent) {
          dispatch({ type: 'SET_PROCESSING', payload: false });
        }
      } catch { /* ignore parse errors */ }
    }) as EventListener);

    // --- error: server-sent error events + connection errors ---------------
    es.addEventListener('error', ((event: Event) => {
      const me = event as MessageEvent;
      if (typeof me.data === 'string' && me.data) {
        try {
          const data = JSON.parse(me.data) as { message: string; agentId?: string; retryable?: boolean };
          const errMsg: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: data.message || 'An error occurred.',
            timestamp: new Date().toISOString(),
            metadata: { messageType: 'error', agentName: data.agentId },
          };
          dispatch({ type: 'ADD_MESSAGE', payload: errMsg });
        } catch { /* ignore parse errors */ }
      }

      // If EventSource is permanently closed, stop processing
      if (es.readyState === EventSource.CLOSED) {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    }) as EventListener);

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [campaignId, dispatch]);
}
