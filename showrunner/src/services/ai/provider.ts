/**
 * AI boundary. Ollama (local Llama) is the default because it is free and
 * private. A hosted provider (e.g. Claude via your own backend) can be added
 * later for customers who don't run models locally — useful for a paid plan.
 */
export interface CompletionRequest {
  system: string;
  prompt: string;
  json?: boolean;
}

export interface AiProvider {
  complete(req: CompletionRequest): Promise<string>;
}

export interface AiSettings {
  baseUrl: string;
  model: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
};
