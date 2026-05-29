import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useGameStore } from "../store/useGameStore";
import { ITEM_COLOR, ITEM_LABEL } from "../game/recipes";
import { ItemId } from "../game/types";

export function HUD() {
  const power = useGameStore((s) => s.state.power);
  const brownout = useGameStore((s) => s.state.brownout);
  const totals = useGameStore((s) => s.state.totalProduced);
  const lastSaveAt = useGameStore((s) => s.lastSaveAt);
  const toggleResearchPanel = useGameStore((s) => s.toggleResearchPanel);

  const pct = power.generated > 0 ? Math.min(1, power.drawn / power.generated) : 0;
  const items = Object.entries(totals).filter(([, n]) => (n ?? 0) > 0) as [ItemId, number][];

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.row}>
        <View style={styles.powerBox}>
          <Text style={styles.label}>POWER</Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${pct * 100}%`,
                  backgroundColor: brownout ? "#f87171" : "#34d399",
                },
              ]}
            />
          </View>
          <Text style={styles.powerText}>
            {power.drawn} / {power.generated} MW
          </Text>
        </View>
        <Pressable style={styles.researchBtn} onPress={() => toggleResearchPanel(true)}>
          <Text style={styles.researchBtnText}>RESEARCH</Text>
        </Pressable>
      </View>
      {brownout && (
        <View style={styles.brownout}>
          <Text style={styles.brownoutText}>⚡ BROWNOUT — add power or remove buildings</Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemRow}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No items stockpiled yet — connect a Storage to start counting.</Text>
        ) : (
          items.map(([k, n]) => (
            <View key={k} style={styles.itemChip}>
              <View style={[styles.itemDot, { backgroundColor: ITEM_COLOR[k] }]} />
              <Text style={styles.itemLabel}>{ITEM_LABEL[k]}</Text>
              <Text style={styles.itemCount}>{n}</Text>
            </View>
          ))
        )}
      </ScrollView>
      {lastSaveAt > 0 && (
        <Text style={styles.saveText}>saved {Math.max(0, Math.floor((Date.now() - lastSaveAt) / 1000))}s ago</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },
  powerBox: {
    flex: 1,
    backgroundColor: "rgba(12,16,28,0.86)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  label: { color: "#9ca3af", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  barBg: {
    height: 8,
    backgroundColor: "#1e2333",
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 6,
    overflow: "hidden",
  },
  barFill: { height: "100%" },
  powerText: { color: "#f5f6fa", fontSize: 13, fontVariant: ["tabular-nums"] },
  researchBtn: {
    backgroundColor: "#5b3fbf",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  researchBtnText: { color: "#fff", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
  brownout: {
    backgroundColor: "rgba(190,30,30,0.92)",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  brownoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  itemRow: { flexGrow: 0 },
  empty: {
    color: "#6b7180",
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 4,
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(12,16,28,0.86)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  itemDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  itemLabel: { color: "#cbd5e1", fontSize: 11 },
  itemCount: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    fontVariant: ["tabular-nums"],
  },
  saveText: { color: "#4b5061", fontSize: 10, alignSelf: "flex-end" },
});
