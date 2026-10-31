import type { AiProvider, AiSettings, CompletionRequest } from './provider';

export class OllamaProvider implements AiProvider {
  constructor(private settings: AiSettings) {}

  async complete({ system, prompt, json }: CompletionRequest): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${this.settings.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.settings.model,
          stream: false,
          format: json ? 'json' : undefined,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
      });
    } catch {
      throw new Error(`Can't reach Ollama at ${this.settings.baseUrl}. Is the Ollama app running?`);
    }
    if (!res.ok) throw new Error(`Ollama returned ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.message?.content ?? '';
  }
}

export async function listOllamaModels(baseUrl: string): Promise<string[]> {
  const res = await fetch(`${baseUrl}/api/tags`);
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  const data = await res.json();
  return (data.models ?? []).map((m: { name: string }) => m.name);
}
