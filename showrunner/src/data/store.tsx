import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { childrenOf, descendantIds } from '../domain/tree';
import type { Kind, Node } from '../domain/types';
import { OllamaProvider } from '../services/ai/ollama';
import { DEFAULT_AI_SETTINGS, type AiProvider, type AiSettings } from '../services/ai/provider';
import type { AuthProvider, User } from '../services/auth';
import type { Repository } from './repository';

type NewNode = Pick<Node, 'kind' | 'title'> & Partial<Omit<Node, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

interface Store {
  user: User | null;
  nodes: Node[];
  get(id: string): Node | undefined;
  children(parentId: string | null, kind?: Kind): Node[];
  create(fields: NewNode): Node;
  update(id: string, patch: Partial<Node>): void;
  remove(id: string): void;
  replaceAll(nodes: Node[]): Promise<void>;
  ai: AiProvider;
  aiSettings: AiSettings;
  setAiSettings(s: AiSettings): void;
  error: string | null;
  setError(e: string | null): void;
}

const StoreContext = createContext<Store | null>(null);
const AI_SETTINGS_KEY = 'showrunner.ai';

function loadAiSettings(): AiSettings {
  try {
    return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) ?? '{}') };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function StoreProvider({ repo, auth, children }: { repo: Repository; auth: AuthProvider; children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiSettings, setAiSettingsState] = useState(loadAiSettings);
  const ref = useRef<Node[]>([]);

  const commit = (next: Node[]) => {
    ref.current = next;
    setNodes(next);
  };
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  useEffect(() => {
    auth
      .currentUser()
      .then(async (u) => {
        setUser(u);
        commit(await repo.list(u.id));
      })
      .catch(fail);
  }, [repo, auth]);

  const create = useCallback(
    (fields: NewNode): Node => {
      const now = new Date().toISOString();
      const parentId = fields.parentId ?? null;
      const siblings = ref.current.filter((n) => n.parentId === parentId && n.kind === fields.kind);
      const node: Node = {
        notes: '',
        status: 'pitched',
        order: siblings.reduce((max, n) => Math.max(max, n.order), 0) + 1,
        ...fields,
        parentId,
        id: crypto.randomUUID(),
        ownerId: user?.id ?? 'local',
        createdAt: now,
        updatedAt: now,
      };
      commit([...ref.current, node]);
      repo.save([node]).catch(fail);
      return node;
    },
    [repo, user],
  );

  const update = useCallback(
    (id: string, patch: Partial<Node>) => {
      const cur = ref.current.find((n) => n.id === id);
      if (!cur) return;
      const next = { ...cur, ...patch, id, updatedAt: new Date().toISOString() };
      commit(ref.current.map((n) => (n.id === id ? next : n)));
      repo.save([next]).catch(fail);
    },
    [repo],
  );

  const remove = useCallback(
    (id: string) => {
      const ids = descendantIds(ref.current, id);
      const gone = new Set(ids);
      commit(ref.current.filter((n) => !gone.has(n.id)));
      repo.remove(ids).catch(fail);
    },
    [repo],
  );

  const replaceAll = useCallback(
    async (incoming: Node[]) => {
      const owned = incoming.map((n) => ({ ...n, ownerId: user?.id ?? 'local' }));
      await repo.remove(ref.current.map((n) => n.id));
      await repo.save(owned);
      commit(owned);
    },
    [repo, user],
  );

  const setAiSettings = useCallback((s: AiSettings) => {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(s));
    setAiSettingsState(s);
  }, []);

  const value = useMemo<Store>(
    () => ({
      user,
      nodes,
      get: (id) => nodes.find((n) => n.id === id),
      children: (parentId, kind) => childrenOf(nodes, parentId, kind),
      create,
      update,
      remove,
      replaceAll,
      ai: new OllamaProvider(aiSettings),
      aiSettings,
      setAiSettings,
      error,
      setError,
    }),
    [user, nodes, create, update, remove, replaceAll, aiSettings, setAiSettings, error],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
