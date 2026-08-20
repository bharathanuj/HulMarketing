import { Agent } from './Agent';
import { modelConfig } from '../config/modelConfig';
import { PipelineContext } from '../types';
import { OllamaService } from '../services/OllamaService';

interface EvidencePack {
  summary: string;
  whoIsInvolved: string[];
  whyTrending: string;
  audienceSentiment: string;
}

/**
 * CONTEXT AGENT — builds a short evidence pack: what happened, who's involved,
 * why it's trending, what the audience is saying. Uses Ollama for synthesis
 * across the clustered raw mentions attached to the signal.
 */
export class ContextAgent extends Agent<EvidencePack> {
  readonly name = 'ContextAgent';
  get model() { return modelConfig.reasoning; }

  constructor(ollama: OllamaService) {
    super(ollama);
  }

  protected async execute(context: PipelineContext): Promise<EvidencePack> {
    const signal = context.signal!;
    const pack = await this.ollama.generateJson<EvidencePack>({
      model: this.model!,
      system:
        'You are the Context Agent inside a brand activation system. Summarize a cultural signal ' +
        'factually and concisely. Respond ONLY as JSON: {"summary": "...", "whoIsInvolved": ["..."], ' +
        '"whyTrending": "...", "audienceSentiment": "..."}',
      prompt: `Raw signal payload: ${JSON.stringify(signal.rawPayload)}. Entities detected: ${signal.entities.join(', ')}.`,
    });
    context.evidencePack = pack;
    return pack;
  }
}
