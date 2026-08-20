import fetch from 'node-fetch';

export interface OllamaGenerateOptions {
  model: string;
  prompt: string;
  system?: string;
  format?: 'json';
  temperature?: number;
}

/**
 * Thin wrapper around Ollama's hosted Cloud API (https://ollama.com by default),
 * not a locally-run `ollama serve` instance — no local GPU/RAM needed, inference
 * happens on Ollama's servers. Every agent that needs reasoning, scoring
 * rationale, or copy generation goes through this single class — swapping
 * models, adding retries/timeouts, or moving to self-hosted later only touches
 * this file.
 *
 * Requires an Ollama Cloud API key (create one at ollama.com/settings/keys) set
 * as OLLAMA_API_KEY, and cloud catalog model ids in OLLAMA_*_MODEL (e.g.
 * "gpt-oss:120b", "kimi-k2.6", "deepseek-v4-flash" — cloud ids, not local pull
 * names). If OLLAMA_BASE_URL is pointed at a localhost/private host instead, no
 * key is required and this same client talks to a local `ollama serve` too.
 */
export class OllamaService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(
    baseUrl: string = process.env.OLLAMA_BASE_URL || 'https://ollama.com',
    apiKey: string | undefined = process.env.OLLAMA_API_KEY
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private authHeaders(): Record<string, string> {
    // Local/private hosts (localhost, 127.0.0.1, .local, private IPs) don't need a token.
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|.*\.local)(:|\/|$)/.test(this.baseUrl);
    if (isLocal || !this.apiKey) return {};
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  async generate(options: OllamaGenerateOptions): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({
        model: options.model,
        prompt: options.prompt,
        system: options.system,
        format: options.format,
        stream: false,
        options: { temperature: options.temperature ?? 0.4 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama Cloud request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { response: string };
    return data.response;
  }

  /** Convenience helper for agents that need structured JSON back from the model. */
  async generateJson<T>(options: OllamaGenerateOptions): Promise<T> {
    const raw = await this.generate({ ...options, format: 'json' });
    return JSON.parse(raw) as T;
  }
}
