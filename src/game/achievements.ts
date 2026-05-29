import { GameState } from "./types";

export type Achievement = {
  id: string;
  label: string;
  desc: string;
  check: (s: GameState) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_build",
    label: "Groundbreaking",
    desc: "Place your first building.",
    check: (s) => Object.keys(s.buildings).length >= 1,
  },
  {
    id: "first_belt",
    label: "Logistics 101",
    desc: "Place your first conveyor belt.",
    check: (s) => Object.keys(s.belts).length >= 1,
  },
  {
    id: "first_ingot",
    label: "Liquid Metal",
    desc: "Produce 1 ingot of any kind.",
    check: (s) =>
      (s.totalProduced.iron_ingot ?? 0) + (s.totalProduced.copper_ingot ?? 0) >= 1,
  },
  {
    id: "ten_plates",
    label: "Plate Factory",
    desc: "Stockpile 10 iron plates.",
    check: (s) => (s.totalProduced.iron_plate ?? 0) >= 10,
  },
  {
    id: "powered_up",
    label: "Powered Up",
    desc: "Build a working coal generator.",
    check: (s) =>
      Object.values(s.buildings).some((b) => b.kind === "coal_gen") &&
      s.power.generated > s.power.baseline,
  },
  {
    id: "copper_age",
    label: "Bronze Age",
    desc: "Unlock the copper line.",
    check: (s) => s.research.includes("copper_line"),
  },
  {
    id: "assembler_online",
    label: "Assembler Online",
    desc: "Build an assembler.",
    check: (s) => Object.values(s.buildings).some((b) => b.kind === "assembler"),
  },
  {
    id: "circuit_baron",
    label: "Circuit Baron",
    desc: "Produce 5 circuits.",
    check: (s) => (s.totalProduced.circuit ?? 0) >= 5,
  },
  {
    id: "fully_researched",
    label: "Tech Tree Complete",
    desc: "Unlock every research node.",
    check: (s) => s.research.length >= 4,
  },
  {
    id: "industrial_complex",
    label: "Industrial Complex",
    desc: "Have 10 buildings on the map.",
    check: (s) => Object.keys(s.buildings).length >= 10,
  },
];
