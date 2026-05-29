import { BuildingKind, ResearchId } from "./types";

export type BuildingSpec = {
  kind: BuildingKind;
  label: string;
  color: string;
  powerDraw: number; // MW (negative = generator)
  inputs: number;
  outputs: number;
  requires?: ResearchId;
  description: string;
  mustBeOnNode?: boolean;
};

export const BUILDINGS: Record<BuildingKind, BuildingSpec> = {
  miner: {
    kind: "miner",
    label: "Miner",
    color: "#f59e0b",
    powerDraw: 5,
    inputs: 0,
    outputs: 1,
    description: "Extracts ore. Place on a resource node.",
    mustBeOnNode: true,
  },
  smelter: {
    kind: "smelter",
    label: "Smelter",
    color: "#ef4444",
    powerDraw: 10,
    inputs: 1,
    outputs: 1,
    description: "Smelts ore into ingots.",
  },
  constructor: {
    kind: "constructor",
    label: "Constructor",
    color: "#3b82f6",
    powerDraw: 8,
    inputs: 1,
    outputs: 1,
    description: "Single-input crafting (plates, rods, wire).",
  },
  assembler: {
    kind: "assembler",
    label: "Assembler",
    color: "#8b5cf6",
    powerDraw: 15,
    inputs: 2,
    outputs: 1,
    requires: "assembler",
    description: "Combines two inputs (reinforced plate, circuit).",
  },
  coal_gen: {
    kind: "coal_gen",
    label: "Coal Generator",
    color: "#22c55e",
    powerDraw: -75,
    inputs: 1,
    outputs: 0,
    description: "Burns coal to generate 75 MW.",
  },
  storage: {
    kind: "storage",
    label: "Storage",
    color: "#6b7280",
    powerDraw: 0,
    inputs: 1,
    outputs: 0,
    description: "Counts incoming items toward your stockpile.",
  },
};

export const COAL_GEN_FUEL_MS = 4000;
