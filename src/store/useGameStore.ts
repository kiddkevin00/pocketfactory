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
} from "../game/engine";
import { saveGame, loadGame } from "../game/save";

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
  showMenu: boolean;
  lastSaveAt: number;

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
  toggleMenu: (open?: boolean) => void;
  resetGame: () => void;
  hydrate: (s: GameState) => void;
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
  showMenu: false,
  lastSaveAt: 0,

  bumpTick: (dt) =>
    set((s) => {
      const next = cloneState(s.state);
      tick(next, dt);
      return { state: next };
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
  toggleMenu: (open) => set((s) => ({ showMenu: open ?? !s.showMenu })),

  resetGame: () => set({ state: newGame(), tool: { kind: "none" }, selectedBuildingId: null }),
  hydrate: (s) => set({ state: s }),
}));

// ---- side-effect helpers ----

let tickHandle: ReturnType<typeof setInterval> | null = null;
let saveHandle: ReturnType<typeof setInterval> | null = null;

export function startGameLoop(): void {
  if (tickHandle) return;
  const TICK_MS = 100;
  tickHandle = setInterval(() => useGameStore.getState().bumpTick(TICK_MS), TICK_MS);
  saveHandle = setInterval(() => {
    const s = useGameStore.getState().state;
    saveGame(s);
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
}
