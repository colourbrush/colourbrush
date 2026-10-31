// Everything in Showrunner is a Node in one tree:
//   Show (a project) → Season (an arc/theme) → Episode (a finishable deliverable) → Clip (one sitting of work)
// Ideas live loose in the Writers' Room until they are promoted into the tree.

export type Kind = 'show' | 'season' | 'episode' | 'clip' | 'idea';
export type Status = 'pitched' | 'in_production' | 'wrapped' | 'shelved';

export interface Node {
  id: string;
  kind: Kind;
  parentId: string | null;
  ownerId: string;
  title: string;
  notes: string;
  status: Status;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const STATUSES: Status[] = ['pitched', 'in_production', 'wrapped', 'shelved'];

export const STATUS_LABEL: Record<Status, string> = {
  pitched: 'Pitched',
  in_production: 'In production',
  wrapped: 'Wrapped',
  shelved: 'Shelved',
};

export const KIND_LABEL: Record<Kind, string> = {
  show: 'Show',
  season: 'Season',
  episode: 'Episode',
  clip: 'Clip',
  idea: 'Idea',
};

export const CHILD_KIND: Partial<Record<Kind, Kind>> = {
  show: 'season',
  season: 'episode',
  episode: 'clip',
};

export function nextStatus(s: Status): Status {
  return STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length];
}
