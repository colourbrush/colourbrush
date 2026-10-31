import { outline } from '../../domain/tree';
import { CHILD_KIND, KIND_LABEL, type Node } from '../../domain/types';
import type { AiProvider } from './provider';

const STRUCTURE = `The creator organises work like a TV series:
- Show = a project.
- Season = a big theme or arc within the show.
- Episode = a meaningful, finishable deliverable.
- Clip = a small task that fits in one sitting.
The creator has a wandering mind, so keep things concrete, small and motivating.`;

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('The model did not return valid JSON. Try again or pick a larger model.');
  }
}

export interface Suggestion {
  title: string;
  notes: string;
}

/** Propose the next level down: seasons for a show, episodes for a season, clips for an episode. */
export async function suggestChildren(ai: AiProvider, nodes: Node[], show: Node, target: Node, count = 4): Promise<Suggestion[]> {
  const childKind = CHILD_KIND[target.kind];
  if (!childKind) return [];
  const text = await ai.complete({
    json: true,
    system: `You are the head writer in a writers' room. ${STRUCTURE}\nRespond only with JSON.`,
    prompt: `The show so far:\n${outline(nodes, show.id)}\n\nPropose ${count} new ${KIND_LABEL[childKind]}s for the ${KIND_LABEL[target.kind]} "${target.title}". Do not repeat existing ones.\nReturn {"items":[{"title":"short title","notes":"one sentence"}]}`,
  });
  const items = parseJson<{ items?: Suggestion[] }>(text).items ?? [];
  return items.filter((i) => i && typeof i.title === 'string').map((i) => ({ title: i.title, notes: i.notes ?? '' }));
}

/** "Previously on…" — a short recap of where the show stands and what to do next. */
export async function recap(ai: AiProvider, nodes: Node[], show: Node): Promise<string> {
  return ai.complete({
    system: `You narrate "Previously on…" recaps for a solo creator returning to a project. ${STRUCTURE}\nBe warm and brief (under 120 words). Finish with one line starting "Next on ${show.title}:" naming the single best clip to do next.`,
    prompt: `Today is ${new Date().toISOString().slice(0, 10)}.\n${outline(nodes, show.id)}`,
  });
}

/** Decide which show a loose idea belongs to, if any. */
export async function triage(ai: AiProvider, idea: Node, shows: Node[]): Promise<{ showId: string | null; reason: string }> {
  const list = shows.map((s) => `- id=${s.id} | ${s.title}${s.notes ? ` — ${s.notes}` : ''}`).join('\n');
  const text = await ai.complete({
    json: true,
    system: `You sort ideas in a writers' room. ${STRUCTURE}\nRespond only with JSON.`,
    prompt: `Shows:\n${list || '(none yet)'}\n\nIdea: "${idea.title}"${idea.notes ? `\n${idea.notes}` : ''}\n\nDoes it belong in an existing show, or is it a new show? Return {"showId":"<id or null>","reason":"one sentence"}`,
  });
  const out = parseJson<{ showId?: string | null; reason?: string }>(text);
  const showId = shows.some((s) => s.id === out.showId) ? out.showId! : null;
  return { showId, reason: out.reason ?? '' };
}
