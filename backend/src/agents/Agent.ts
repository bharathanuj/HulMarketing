import { AgentResult, PipelineContext } from '../types';
import { OllamaService } from '../services/OllamaService';

/**
 * Every one of the 12 NEXT agents extends this class.
 * Design pattern: Template Method — `run()` handles timing, logging and error
 * envelopes uniformly; subclasses only implement `execute()`.
 * This is also what makes least-privilege enforcement possible: each agent
 * only receives the OllamaService and the slice of context it needs.
 */
export abstract class Agent<TOutput = unknown> {
  abstract readonly name: string;
  /** Which local Ollama model this agent calls, if any. Deterministic agents (e.g. scoring) leave this undefined. */
  abstract readonly model?: string;

  constructor(protected readonly ollama: OllamaService) {}

  async run(context: PipelineContext): Promise<AgentResult<TOutput>> {
    const start = Date.now();
    try {
      const data = await this.execute(context);
      const result: AgentResult<TOutput> = {
        agentName: this.name,
        success: true,
        data,
        modelUsed: this.model,
        durationMs: Date.now() - start,
      };
      context.log.push(result);
      return result;
    } catch (err) {
      const result: AgentResult<TOutput> = {
        agentName: this.name,
        success: false,
        data: null as unknown as TOutput,
        modelUsed: this.model,
        durationMs: Date.now() - start,
        notes: err instanceof Error ? err.message : 'Unknown error',
      };
      context.log.push(result);
      throw result;
    }
  }

  protected abstract execute(context: PipelineContext): Promise<TOutput>;
}
