import { create } from "zustand";
import { GameState, BuildingKind } from "../game/types";
import {
  newGame,
  tick,
  place,
  remove,
  setRecipe,
  connect,
  removeBelt,
  doResearch,
  canPlace,
  reseedIds,
} from "../game/engine";
import { saveGame, loadGame, loadMeta, saveMeta } from "../game/save";
import { ACHIEVEMENTS } from "../game/achievements";

// Tool selection for the UI: which build action is active.
export type Tool =
  | { kind: "none" }
  | { kind: "build"; building: BuildingKind }
  | { kind: "belt"; fromId?: string }
  | { kind: "remove" };

type Store = {
  state: GameState;
  tool: Tool;
  selectedBuildingId: string | null;
  showResearch: boolean;
  showAchievements: boolean;
  showMenu: boolean;
  lastSaveAt: number;
  tutorialDismissed: boolean;
  unlockedAchievements: string[];
  recentAchievement: { id: string; label: string } | null;
  achievementQueue: { id: string; label: string }[];

  // mutations (mutate via setState w/ shallow clone of state)
  bumpTick: (dt: number) => void;
  setTool: (t: Tool) => void;
  selectBuilding: (id: string | null) => void;
  placeAt: (kind: BuildingKind, x: number, y: number) => { ok: boolean; reason?: string };
  removeBuilding: (id: string) => void;
  setBuildingRecipe: (id: string, recipe: string | undefined) => void;
  connectBuildings: (fromId: string, toId: string) => boolean;
  deleteBelt: (id: string) => void;
  research: (id: string) => boolean;
  toggleResearchPanel: (open?: boolean) => void;
  toggleAchievementsPanel: (open?: boolean) => void;
  toggleMenu: (open?: boolean) => void;
  clearRecentAchievement: () => void;
  resetGame: () => void;
  hydrate: (s: GameState) => void;
  dismissTutorial: () => void;
};

function cloneState(s: GameState): GameState {
  // Sufficient deep clone for our plain-JSON shape
  return JSON.parse(JSON.stringify(s));
}

export const useGameStore = create<Store>((set, get) => ({
  state: newGame(),
  tool: { kind: "none" },
  selectedBuildingId: null,
  showResearch: false,
  showAchievements: false,
  showMenu: false,
  lastSaveAt: 0,
  tutorialDismissed: false,
  unlockedAchievements: [],
  recentAchievement: null,
  achievementQueue: [],

  bumpTick: (dt) =>
    set((s) => {
      const next = cloneState(s.state);
      tick(next, dt);
      // Check achievements; queue every newly-unlocked one so none are missed.
      const unlocked = [...s.unlockedAchievements];
      const newlyUnlocked: { id: string; label: string }[] = [];
      for (const a of ACHIEVEMENTS) {
        if (unlocked.includes(a.id)) continue;
        if (a.check(next)) {
          unlocked.push(a.id);
          newlyUnlocked.push({ id: a.id, label: a.label });
        }
      }
      const patch: Partial<Store> = { state: next };
      if (newlyUnlocked.length > 0) {
        patch.unlockedAchievements = unlocked;
        // Append to queue; if nothing currently displayed, promote the first.
        const queue = [...s.achievementQueue, ...newlyUnlocked];
        if (!s.recentAchievement && queue.length > 0) {
          patch.recentAchievement = queue[0];
          patch.achievementQueue = queue.slice(1);
        } else {
          patch.achievementQueue = queue;
        }
      }
      return patch;
    }),

  setTool: (t) => set({ tool: t, selectedBuildingId: null }),

  selectBuilding: (id) => set({ selectedBuildingId: id }),

  placeAt: (kind, x, y) => {
    const check = canPlace(get().state, kind, x, y);
    if (!check.ok) return check;
    set((s) => {
      const next = cloneState(s.state);
      place(next, kind, x, y);
      return { state: next };
    });
    return { ok: true };
  },

  removeBuilding: (id) =>
    set((s) => {
      const next = cloneState(s.state);
      remove(next, id);
      return { state: next, selectedBuildingId: null };
    }),

  setBuildingRecipe: (id, recipe) =>
    set((s) => {
      const next = cloneState(s.state);
      setRecipe(next, id, recipe);
      return { state: next };
    }),

  connectBuildings: (fromId, toId) => {
    let ok = false;
    set((s) => {
      const next = cloneState(s.state);
      const belt = connect(next, fromId, toId);
      ok = !!belt;
      return { state: next };
    });
    return ok;
  },

  deleteBelt: (id) =>
    set((s) => {
      const next = cloneState(s.state);
      removeBelt(next, id);
      return { state: next };
    }),

  research: (id) => {
    let ok = false;
    set((s) => {
      const next = cloneState(s.state);
      ok = doResearch(next, id);
      return { state: next };
    });
    return ok;
  },

  toggleResearchPanel: (open) =>
    set((s) => ({ showResearch: open ?? !s.showResearch })),
  toggleAchievementsPanel: (open) =>
    set((s) => ({ showAchievements: open ?? !s.showAchievements })),
  toggleMenu: (open) => set((s) => ({ showMenu: open ?? !s.showMenu })),
  clearRecentAchievement: () =>
    set((s) => {
      // Pop the next queued achievement (if any) so toasts stack one-at-a-time.
      if (s.achievementQueue.length === 0) return { recentAchievement: null };
      return {
        recentAchievement: s.achievementQueue[0],
        achievementQueue: s.achievementQueue.slice(1),
      };
    }),

  resetGame: () => set({ state: newGame(), tool: { kind: "none" }, selectedBuildingId: null, tutorialDismissed: false, unlockedAchievements: [], recentAchievement: null, achievementQueue: [] }),
  hydrate: (s) => {
    reseedIds(s);
    set({ state: s });
  },
  dismissTutorial: () => {
    const cur = get();
    set({ tutorialDismissed: true });
    saveMeta({ tutorialDismissed: true, unlockedAchievements: cur.unlockedAchievements });
  },
}));

// ---- side-effect helpers ----

let tickHandle: ReturnType<typeof setInterval> | null = null;
let saveHandle: ReturnType<typeof setInterval> | null = null;

export function startGameLoop(): void {
  if (tickHandle) return;
  const TICK_MS = 100;
  tickHandle = setInterval(() => useGameStore.getState().bumpTick(TICK_MS), TICK_MS);
  saveHandle = setInterval(() => {
    const st = useGameStore.getState();
    saveGame(st.state);
    saveMeta({ tutorialDismissed: st.tutorialDismissed, unlockedAchievements: st.unlockedAchievements });
    useGameStore.setState({ lastSaveAt: Date.now() });
  }, 10000);
}

export function stopGameLoop(): void {
  if (tickHandle) clearInterval(tickHandle);
  if (saveHandle) clearInterval(saveHandle);
  tickHandle = null;
  saveHandle = null;
}

export async function loadIfPresent(): Promise<void> {
  const s = await loadGame();
  if (s) useGameStore.getState().hydrate(s);
  const meta = await loadMeta();
  if (meta) {
    useGameStore.setState({
      tutorialDismissed: !!meta.tutorialDismissed,
      unlockedAchievements: meta.unlockedAchievements ?? [],
    });
  }
}
