export type ItemId =
  | "iron_ore"
  | "copper_ore"
  | "coal"
  | "iron_ingot"
  | "copper_ingot"
  | "iron_plate"
  | "iron_rod"
  | "wire"
  | "reinforced_plate"
  | "circuit";

export type BuildingKind =
  | "miner"
  | "smelter"
  | "constructor"
  | "assembler"
  | "coal_gen"
  | "storage";

export type ResearchId =
  | "copper_line"
  | "assembler"
  | "fast_belts"
  | "power_overclock";

export type ResourceKind = "iron_ore" | "copper_ore" | "coal";

export type ResourceNode = {
  x: number;
  y: number;
  kind: ResourceKind;
};

export type Recipe = {
  id: string;
  inputs: Partial<Record<ItemId, number>>;
  outputs: Partial<Record<ItemId, number>>;
  durationMs: number;
  building: BuildingKind;
  requires?: ResearchId;
};

export type Building = {
  id: string;
  kind: BuildingKind;
  x: number;
  y: number;
  recipeId?: string;
  progressMs: number;
  inputBuf: Partial<Record<ItemId, number>>;
  outputBuf: Partial<Record<ItemId, number>>;
};

export type Belt = {
  id: string;
  fromBuildingId: string;
  toBuildingId: string;
  path: { x: number; y: number }[];
  items: { itemId: ItemId; t: number }[]; // t in [0,1] along path
};

export type GameState = {
  worldW: number;
  worldH: number;
  nodes: ResourceNode[];
  buildings: Record<string, Building>;
  belts: Record<string, Belt>;
  research: ResearchId[];
  totalProduced: Partial<Record<ItemId, number>>; // sink/storage running total
  power: { generated: number; drawn: number; baseline: number };
  brownout: boolean;
  tickMs: number;
  version: number;
};

export const WORLD_W = 30;
export const WORLD_H = 30;
