import { Agent } from './Agent';
import { PipelineContext, Signal } from '../types';

/**
 * SIGNAL AGENT — watches incoming event streams (social/news/search/sports/consumer)
 * and turns a raw event into a normalized Signal object. Deterministic: no LLM call
 * needed here, arithmetic/velocity comparisons should never be delegated to a model.
 */
export class SignalAgent extends Agent<Signal> {
  readonly name = 'SignalAgent';
  readonly model = undefined;

  protected async execute(context: PipelineContext): Promise<Signal> {
    if (!context.signal) {
      throw new Error('SignalAgent requires a raw signal on the context');
    }
    // In production this normalizes timestamps, geography/language tags, and
    // dedupes against the last N minutes of signals for the same entity.
    return context.signal;
  }
}
