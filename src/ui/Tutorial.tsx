import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useGameStore } from "../store/useGameStore";

type Step = {
  id: string;
  title: string;
  body: string;
  done: (s: ReturnType<typeof useGameStore.getState>["state"]) => boolean;
};

const STEPS: Step[] = [
  {
    id: "place_miner",
    title: "1. Place a Miner",
    body: "Tap Miner in the bottom toolbar, then tap any glowing resource node (Fe = iron, Cu = copper, C = coal).",
    done: (s) => Object.values(s.buildings).some((b) => b.kind === "miner"),
  },
  {
    id: "place_smelter",
    title: "2. Place a Smelter",
    body: "Smelters turn ore into ingots. Place one next to your miner. Tap it to pick the smelt recipe.",
    done: (s) => Object.values(s.buildings).some((b) => b.kind === "smelter"),
  },
  {
    id: "connect_belt",
    title: "3. Connect a Belt",
    body: "Pick Belt in the toolbar, tap your miner, then tap your smelter. Items will flow between them.",
    done: (s) => Object.keys(s.belts).length > 0,
  },
  {
    id: "place_storage",
    title: "4. Add Storage",
    body: "Storage tallies finished goods — needed to research new tech. Belt your smelter output into a Storage.",
    done: (s) => Object.values(s.buildings).some((b) => b.kind === "storage"),
  },
  {
    id: "produce_5",
    title: "5. Produce 5 iron ingots",
    body: "Watch the count rise in the top bar. Once you've stockpiled some, open RESEARCH to unlock more tech.",
    done: (s) => (s.totalProduced.iron_ingot ?? 0) >= 5 || (s.totalProduced.iron_plate ?? 0) >= 1,
  },
];

export function Tutorial() {
  const state = useGameStore((s) => s.state);
  const dismissed = useGameStore((s) => s.tutorialDismissed);
  const dismiss = useGameStore((s) => s.dismissTutorial);

  if (dismissed) return null;

  const current = STEPS.find((s) => !s.done(state));
  if (!current) return null;

  const idx = STEPS.indexOf(current);

  return (
    <View style={[styles.wrap, { pointerEvents: "box-none" }]}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.tag}>TUTORIAL · {idx + 1}/{STEPS.length}</Text>
          <Pressable onPress={dismiss}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
        <View style={styles.progressBar}>
          {STEPS.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                i < idx && styles.dotDone,
                i === idx && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 80,
    left: 12,
    right: 12,
  },
  card: {
    backgroundColor: "rgba(15,19,32,0.97)",
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.5)",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.5)",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { color: "#fde68a", fontWeight: "800", fontSize: 10, letterSpacing: 1.5 },
  skip: { color: "#6b7180", fontSize: 11 },
  title: { color: "#fff", fontWeight: "700", fontSize: 14 },
  body: { color: "#cbd5e1", fontSize: 12, lineHeight: 17 },
  progressBar: { flexDirection: "row", gap: 6, marginTop: 4 },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: "#2c3247" },
  dotActive: { backgroundColor: "#fde68a" },
  dotDone: { backgroundColor: "#34d399" },
});
