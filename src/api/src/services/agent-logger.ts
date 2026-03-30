import { logger } from '../logger.js';

interface AgentLogger {
  start(): void;
  complete(durationMs: number): void;
  error(errorType: string, err: Error): void;
}

export function createAgentLogger(agentName: string): AgentLogger {
  return {
    start() {
      logger.info({ agentName, action: 'start' }, `${agentName} agent started`);
    },
    complete(durationMs: number) {
      logger.info(
        { agentName, action: 'complete', durationMs },
        `${agentName} agent completed in ${durationMs}ms`,
      );
    },
    error(errorType: string, _err: Error) {
      logger.error(
        { agentName, action: 'error', errorType },
        `${agentName} agent error: ${errorType}`,
      );
    },
  };
}
