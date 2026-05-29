import {
  Building,
  Belt,
  GameState,
  ItemId,
  ResourceNode,
  WORLD_W,
  WORLD_H,
} from "./types";
import { getRecipe, MINER_PERIOD_MS } from "./recipes";
import { BUILDINGS, COAL_GEN_FUEL_MS } from "./buildings";

const BUFFER_CAP = 8;
const BELT_TRAVEL_MS = 4000; // ms to cross one belt path end-to-end at base speed
const FAST_MULT = 2;

let idCounter = 1;
export function newId(prefix: string): string {
  return `${prefix}_${idCounter++}_${Math.random().toString(36).slice(2, 6)}`;
}

export function newGame(): GameState {
  idCounter = 1;
  const nodes: ResourceNode[] = [
    { x: 5, y: 6, kind: "iron_ore" },
    { x: 8, y: 5, kind: "iron_ore" },
    { x: 12, y: 9, kind: "copper_ore" },
    { x: 15, y: 7, kind: "copper_ore" },
    { x: 20, y: 12, kind: "coal" },
    { x: 22, y: 15, kind: "coal" },
    { x: 6, y: 20, kind: "iron_ore" },
    { x: 18, y: 22, kind: "copper_ore" },
  ];
  return {
    worldW: WORLD_W,
    worldH: WORLD_H,
    nodes,
    buildings: {},
    belts: {},
    research: [],
    totalProduced: {},
    power: { generated: 50, drawn: 0, baseline: 50 },
    brownout: false,
    tickMs: 0,
    version: 1,
  };
}

export function nodeAt(state: GameState, x: number, y: number): ResourceNode | undefined {
  return state.nodes.find((n) => n.x === x && n.y === y);
}

export function buildingAt(state: GameState, x: number, y: number): Building | undefined {
  return Object.values(state.buildings).find((b) => b.x === x && b.y === y);
}

export function canPlace(
  state: GameState,
  kind: Building["kind"],
  x: number,
  y: number,
): { ok: boolean; reason?: string } {
  if (x < 0 || y < 0 || x >= state.worldW || y >= state.worldH)
    return { ok: false, reason: "Out of bounds" };
  if (buildingAt(state, x, y)) return { ok: false, reason: "Occupied" };
  const spec = BUILDINGS[kind];
  if (spec.mustBeOnNode && !nodeAt(state, x, y))
    return { ok: false, reason: "Must be placed on a resource node" };
  if (!spec.mustBeOnNode && nodeAt(state, x, y))
    return { ok: false, reason: "Cannot build on resource node" };
  if (spec.requires && !state.research.includes(spec.requires))
    return { ok: false, reason: "Research required" };
  return { ok: true };
}

export function place(state: GameState, kind: Building["kind"], x: number, y: number): Building | null {
  const check = canPlace(state, kind, x, y);
  if (!check.ok) return null;
  const b: Building = {
    id: newId("b"),
    kind,
    x,
    y,
    progressMs: 0,
    inputBuf: {},
    outputBuf: {},
  };
  state.buildings[b.id] = b;
  return b;
}

export function remove(state: GameState, buildingId: string): void {
  const b = state.buildings[buildingId];
  if (!b) return;
  delete state.buildings[buildingId];
  // remove belts touching this building
  for (const beltId of Object.keys(state.belts)) {
    const belt = state.belts[beltId];
    if (belt.fromBuildingId === buildingId || belt.toBuildingId === buildingId) {
      delete state.belts[beltId];
    }
  }
}

export function setRecipe(state: GameState, buildingId: string, recipeId: string | undefined): void {
  const b = state.buildings[buildingId];
  if (!b) return;
  b.recipeId = recipeId;
  b.progressMs = 0;
}

export function connect(
  state: GameState,
  fromId: string,
  toId: string,
): Belt | null {
  const from = state.buildings[fromId];
  const to = state.buildings[toId];
  if (!from || !to) return null;
  if (from.id === to.id) return null;
  if (BUILDINGS[from.kind].outputs === 0) return null;
  if (BUILDINGS[to.kind].inputs === 0) return null;
  // already a belt from→to?
  const existing = Object.values(state.belts).find(
    (b) => b.fromBuildingId === fromId && b.toBuildingId === toId,
  );
  if (existing) return existing;
  const path = routePath(from.x, from.y, to.x, to.y);
  const belt: Belt = {
    id: newId("belt"),
    fromBuildingId: fromId,
    toBuildingId: toId,
    path,
    items: [],
  };
  state.belts[belt.id] = belt;
  return belt;
}

export function removeBelt(state: GameState, beltId: string): void {
  delete state.belts[beltId];
}

function routePath(x1: number, y1: number, x2: number, y2: number): { x: number; y: number }[] {
  // simple L-shaped path: horizontal then vertical
  const pts: { x: number; y: number }[] = [];
  pts.push({ x: x1, y: y1 });
  const dx = Math.sign(x2 - x1);
  for (let x = x1 + dx; dx !== 0 && x !== x2; x += dx) pts.push({ x, y: y1 });
  if (dx !== 0) pts.push({ x: x2, y: y1 });
  const dy = Math.sign(y2 - y1);
  for (let y = y1 + dy; dy !== 0 && y !== y2; y += dy) pts.push({ x: x2, y });
  if (dy !== 0) pts.push({ x: x2, y: y2 });
  if (pts.length === 1) pts.push({ x: x2, y: y2 });
  return pts;
}

export function tick(state: GameState, dt: number): void {
  state.tickMs += dt;

  // 1. Power: sum draws + generated. Generators are accounted for as they produce.
  // First compute potential draw (all non-generator powered buildings).
  let drawn = 0;
  for (const b of Object.values(state.buildings)) {
    const spec = BUILDINGS[b.kind];
    if (spec.powerDraw > 0) drawn += spec.powerDraw;
  }
  const brownout = drawn > state.power.generated;
  state.brownout = brownout;
  state.power.drawn = drawn;

  // 2. Producers
  for (const b of Object.values(state.buildings)) {
    if (brownout) continue;
    switch (b.kind) {
      case "miner": {
        const node = nodeAt(state, b.x, b.y);
        if (!node) break;
        const period = MINER_PERIOD_MS[node.kind] ?? 2000;
        b.progressMs += dt;
        if (b.progressMs >= period) {
          b.progressMs -= period;
          const cur = b.outputBuf[node.kind] ?? 0;
          if (cur < BUFFER_CAP) b.outputBuf[node.kind] = cur + 1;
        }
        break;
      }
      case "smelter":
      case "constructor":
      case "assembler": {
        if (!b.recipeId) break;
        const r = getRecipe(b.recipeId);
        if (!r) break;
        // need inputs available
        const haveInputs = Object.entries(r.inputs).every(
          ([k, n]) => (b.inputBuf[k as ItemId] ?? 0) >= (n ?? 0),
        );
        // need output space (don't overflow >BUFFER_CAP for any output)
        const hasSpace = Object.entries(r.outputs).every(
          ([k, n]) => (b.outputBuf[k as ItemId] ?? 0) + (n ?? 0) <= BUFFER_CAP,
        );
        if (!haveInputs || !hasSpace) break;
        b.progressMs += dt;
        if (b.progressMs >= r.durationMs) {
          b.progressMs -= r.durationMs;
          // consume
          for (const [k, n] of Object.entries(r.inputs)) {
            b.inputBuf[k as ItemId] = (b.inputBuf[k as ItemId] ?? 0) - (n ?? 0);
          }
          // produce
          for (const [k, n] of Object.entries(r.outputs)) {
            b.outputBuf[k as ItemId] = (b.outputBuf[k as ItemId] ?? 0) + (n ?? 0);
          }
        }
        break;
      }
      case "coal_gen": {
        // burns fuel; counts toward generation below
        break;
      }
      case "storage": {
        // consume everything in inputBuf to totalProduced
        for (const [k, n] of Object.entries(b.inputBuf)) {
          if (!n) continue;
          state.totalProduced[k as ItemId] =
            (state.totalProduced[k as ItemId] ?? 0) + n;
          b.inputBuf[k as ItemId] = 0;
        }
        break;
      }
    }
  }

  // 3. Coal generator fuel + power
  let generated = state.power.baseline;
  const overclockBonus = state.research.includes("power_overclock") ? 25 : 0;
  for (const b of Object.values(state.buildings)) {
    if (b.kind !== "coal_gen") continue;
    const fuel = b.inputBuf.coal ?? 0;
    if (fuel > 0) {
      b.progressMs += dt;
      if (b.progressMs >= COAL_GEN_FUEL_MS) {
        b.progressMs -= COAL_GEN_FUEL_MS;
        b.inputBuf.coal = fuel - 1;
      }
      generated += -BUILDINGS.coal_gen.powerDraw + overclockBonus; // 75 (+25)
    } else {
      b.progressMs = 0;
    }
  }
  state.power.generated = generated;

  // 4. Belts: move items, deliver
  const beltMs = state.research.includes("fast_belts") ? BELT_TRAVEL_MS / FAST_MULT : BELT_TRAVEL_MS;
  for (const belt of Object.values(state.belts)) {
    const from = state.buildings[belt.fromBuildingId];
    const to = state.buildings[belt.toBuildingId];
    if (!from || !to) continue;
    // try to load: pick any item from from.outputBuf
    if (belt.items.length === 0 || belt.items[belt.items.length - 1].t > 0.15) {
      const available = Object.entries(from.outputBuf).find(([, n]) => (n ?? 0) > 0);
      if (available) {
        const [k] = available;
        from.outputBuf[k as ItemId] = (from.outputBuf[k as ItemId] ?? 0) - 1;
        belt.items.push({ itemId: k as ItemId, t: 0 });
      }
    }
    // advance items
    const step = dt / beltMs;
    for (const it of belt.items) it.t += step;
    // deliver any at t>=1
    const remaining: typeof belt.items = [];
    for (const it of belt.items) {
      if (it.t >= 1) {
        const cur = to.inputBuf[it.itemId] ?? 0;
        if (cur < BUFFER_CAP) {
          to.inputBuf[it.itemId] = cur + 1;
        } else {
          // back-up: leave it at end
          it.t = 1;
          remaining.push(it);
        }
      } else remaining.push(it);
    }
    belt.items = remaining;
  }
}

export function unlock(state: GameState, id: GameState["research"][number]): void {
  if (!state.research.includes(id)) state.research.push(id);
}

export const RESEARCH_COST: Record<string, Partial<Record<ItemId, number>>> = {
  copper_line: { iron_plate: 10 },
  assembler: { wire: 5, iron_plate: 5 },
  fast_belts: { reinforced_plate: 10 },
  power_overclock: { circuit: 5 },
};

export const RESEARCH_LABEL: Record<string, string> = {
  copper_line: "Copper Line",
  assembler: "Assembler",
  fast_belts: "Fast Belts (2×)",
  power_overclock: "Power Overclock (+25 MW)",
};

export const RESEARCH_DESC: Record<string, string> = {
  copper_line: "Unlock copper smelting and wire production.",
  assembler: "Unlock the assembler for multi-input recipes.",
  fast_belts: "Double conveyor belt throughput.",
  power_overclock: "Each coal generator produces +25 MW.",
};

export function canResearch(state: GameState, id: string): boolean {
  if (state.research.includes(id as GameState["research"][number])) return false;
  const cost = RESEARCH_COST[id];
  if (!cost) return false;
  return Object.entries(cost).every(
    ([k, n]) => (state.totalProduced[k as ItemId] ?? 0) >= (n ?? 0),
  );
}

export function doResearch(state: GameState, id: string): boolean {
  if (!canResearch(state, id)) return false;
  const cost = RESEARCH_COST[id];
  for (const [k, n] of Object.entries(cost)) {
    state.totalProduced[k as ItemId] = (state.totalProduced[k as ItemId] ?? 0) - (n ?? 0);
  }
  state.research.push(id as GameState["research"][number]);
  return true;
}
