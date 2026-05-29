import { Recipe, BuildingKind, ItemId } from "./types";

export const RECIPES: Recipe[] = [
  // Miners produce ore at 1 per 2s depending on node type — handled in engine, not via recipe.
  // Smelters
  {
    id: "smelt_iron",
    inputs: { iron_ore: 1 },
    outputs: { iron_ingot: 1 },
    durationMs: 3000,
    building: "smelter",
  },
  {
    id: "smelt_copper",
    inputs: { copper_ore: 1 },
    outputs: { copper_ingot: 1 },
    durationMs: 3000,
    building: "smelter",
    requires: "copper_line",
  },
  // Constructors
  {
    id: "iron_plate",
    inputs: { iron_ingot: 1 },
    outputs: { iron_plate: 1 },
    durationMs: 2000,
    building: "constructor",
  },
  {
    id: "iron_rod",
    inputs: { iron_ingot: 1 },
    outputs: { iron_rod: 1 },
    durationMs: 4000,
    building: "constructor",
  },
  {
    id: "wire",
    inputs: { copper_ingot: 1 },
    outputs: { wire: 2 },
    durationMs: 2000,
    building: "constructor",
    requires: "copper_line",
  },
  // Assemblers
  {
    id: "reinforced_plate",
    inputs: { iron_plate: 2, iron_rod: 1 },
    outputs: { reinforced_plate: 1 },
    durationMs: 8000,
    building: "assembler",
    requires: "assembler",
  },
  {
    id: "circuit",
    inputs: { wire: 2, iron_plate: 1 },
    outputs: { circuit: 1 },
    durationMs: 10000,
    building: "assembler",
    requires: "assembler",
  },
];

export function recipesForBuilding(
  kind: BuildingKind,
  research: string[],
): Recipe[] {
  return RECIPES.filter(
    (r) => r.building === kind && (!r.requires || research.includes(r.requires)),
  );
}

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export const MINER_PERIOD_MS: Record<string, number> = {
  iron_ore: 2000,
  copper_ore: 2000,
  coal: 2500,
};

export const ITEM_LABEL: Record<ItemId, string> = {
  iron_ore: "Iron Ore",
  copper_ore: "Copper Ore",
  coal: "Coal",
  iron_ingot: "Iron Ingot",
  copper_ingot: "Copper Ingot",
  iron_plate: "Iron Plate",
  iron_rod: "Iron Rod",
  wire: "Wire",
  reinforced_plate: "Reinforced Plate",
  circuit: "Circuit",
};

export const ITEM_COLOR: Record<ItemId, string> = {
  iron_ore: "#8a8a92",
  copper_ore: "#c4744a",
  coal: "#1f1f24",
  iron_ingot: "#d9d9e0",
  copper_ingot: "#e8a070",
  iron_plate: "#b8b8c4",
  iron_rod: "#9a9aa6",
  wire: "#f0b070",
  reinforced_plate: "#7080a0",
  circuit: "#5dd17a",
};
