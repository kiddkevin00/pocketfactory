import React from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { useGameStore } from "../store/useGameStore";
import { RESEARCH_COST, RESEARCH_LABEL, RESEARCH_DESC, canResearch } from "../game/engine";
import { ITEM_COLOR, ITEM_LABEL } from "../game/recipes";
import { ItemId, ResearchId } from "../game/types";

const ORDER: ResearchId[] = ["copper_line", "assembler", "fast_belts", "power_overclock"];

export function ResearchModal() {
  const show = useGameStore((s) => s.showResearch);
  const close = useGameStore((s) => s.toggleResearchPanel);
  const state = useGameStore((s) => s.state);
  const research = useGameStore((s) => s.research);

  return (
    <Modal visible={show} transparent animationType="fade" onRequestClose={() => close(false)}>
      <Pressable style={styles.backdrop} onPress={() => close(false)}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>RESEARCH</Text>
            <Pressable onPress={() => close(false)}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Spend stockpiled items (require a Storage building) to unlock new tech.
          </Text>
          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
            {ORDER.map((id) => {
              const cost = RESEARCH_COST[id];
              const unlocked = state.research.includes(id);
              const can = canResearch(state, id);
              return (
                <View key={id} style={[styles.card, unlocked && styles.cardUnlocked]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{RESEARCH_LABEL[id]}</Text>
                    {unlocked ? (
                      <Text style={styles.badge}>UNLOCKED</Text>
                    ) : (
                      <Pressable
                        style={[styles.researchBtn, !can && styles.researchBtnDisabled]}
                        onPress={() => research(id)}
                        disabled={!can}
                      >
                        <Text style={styles.researchBtnText}>{can ? "Unlock" : "Locked"}</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{RESEARCH_DESC[id]}</Text>
                  <View style={styles.costRow}>
                    {Object.entries(cost).map(([k, n]) => {
                      const have = state.totalProduced[k as ItemId] ?? 0;
                      const enough = have >= (n ?? 0);
                      return (
                        <View key={k} style={styles.costChip}>
                          <View style={[styles.dot, { backgroundColor: ITEM_COLOR[k as ItemId] }]} />
                          <Text style={[styles.costText, !enough && { color: "#f87171" }]}>
                            {have}/{n} {ITEM_LABEL[k as ItemId]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  panel: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#0f1320",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: "#fff", fontWeight: "800", fontSize: 18, letterSpacing: 2 },
  close: { color: "#9ca3af", fontSize: 22 },
  subtitle: { color: "#9ca3af", fontSize: 12 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 6,
  },
  cardUnlocked: { borderColor: "rgba(52,211,153,0.6)", backgroundColor: "rgba(52,211,153,0.08)" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cardDesc: { color: "#9ca3af", fontSize: 12 },
  badge: {
    color: "#34d399",
    backgroundColor: "rgba(52,211,153,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "700",
  },
  researchBtn: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  researchBtnDisabled: { backgroundColor: "#3a3050" },
  researchBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  costRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  costChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  costText: { color: "#e5e7eb", fontSize: 11, fontVariant: ["tabular-nums"] },
});
