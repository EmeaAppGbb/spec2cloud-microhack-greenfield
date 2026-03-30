import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAgentLogger } from '../../src/services/agent-logger.js';
import { logger } from '../../src/logger.js';

// Mock the pino logger to capture log calls
vi.mock('../../src/logger.js', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  return { logger: mockLogger };
});

describe('Structured Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('agent start logging', () => {
    it('should produce an info-level log when the planner agent starts', () => {
      const agentLogger = createAgentLogger('planner');
      agentLogger.start();

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          agentName: 'planner',
          action: 'start',
        }),
        expect.any(String),
      );
    });

    it('should include the agent name in start log metadata', () => {
      const agentLogger = createAgentLogger('planner');
      agentLogger.start();

      const logCall = vi.mocked(logger.info).mock.calls[0];
      expect(logCall[0]).toHaveProperty('agentName', 'planner');
    });
  });

  describe('agent complete logging', () => {
    it('should produce an info-level log when the agent completes', () => {
      const agentLogger = createAgentLogger('planner');
      agentLogger.complete(150);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          agentName: 'planner',
          action: 'complete',
          durationMs: 150,
        }),
        expect.any(String),
      );
    });

    it('should include durationMs in complete log metadata', () => {
      const agentLogger = createAgentLogger('planner');
      agentLogger.complete(2500);

      const logCall = vi.mocked(logger.info).mock.calls[0];
      expect(logCall[0]).toHaveProperty('durationMs', 2500);
    });
  });

  describe('agent error logging', () => {
    it('should produce an error-level log when the agent encounters an error', () => {
      const agentLogger = createAgentLogger('planner');
      agentLogger.error('LLM_TIMEOUT', new Error('Request timed out'));

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          agentName: 'planner',
          action: 'error',
          errorType: 'LLM_TIMEOUT',
        }),
        expect.any(String),
      );
    });

    it('should include errorType in error log metadata', () => {
      const agentLogger = createAgentLogger('planner');
      agentLogger.error('PARSE_FAILURE', new Error('Invalid JSON'));

      const logCall = vi.mocked(logger.error).mock.calls[0];
      expect(logCall[0]).toHaveProperty('errorType', 'PARSE_FAILURE');
    });
  });

  describe('no console.log in source files', () => {
    it('should not have any console.log calls in production source files', async () => {
      const { execSync } = await import('child_process');
      // Search for console.log in src/ excluding test files and node_modules
      let grepOutput = '';
      try {
        grepOutput = execSync(
          'grep -rn "console\\.log" src/api/src/ --include="*.ts" || true',
          { cwd: '/workspaces/spec2cloud-microhack-greenfield', encoding: 'utf-8' },
        );
      } catch {
        // grep returns exit code 1 if no matches — that's the expected success case
        grepOutput = '';
      }

      // Filter out any legitimate uses (e.g., logger setup)
      const violations = grepOutput
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .filter((line) => !line.includes('// allowed:'));

      expect(violations).toEqual([]);
    });
  });
});
