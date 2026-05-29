import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useGameStore } from "../store/useGameStore";
import { BUILDINGS } from "../game/buildings";
import { ITEM_COLOR, ITEM_LABEL, recipesForBuilding, getRecipe } from "../game/recipes";
import { ItemId } from "../game/types";

export function BuildingSheet() {
  const id = useGameStore((s) => s.selectedBuildingId);
  const building = useGameStore((s) => (id ? s.state.buildings[id] : null));
  const research = useGameStore((s) => s.state.research);
  const setRecipe = useGameStore((s) => s.setBuildingRecipe);
  const removeBuilding = useGameStore((s) => s.removeBuilding);
  const select = useGameStore((s) => s.selectBuilding);

  if (!id || !building) return null;
  const spec = BUILDINGS[building.kind];
  const availableRecipes = recipesForBuilding(building.kind, research);
  const currentRecipe = building.recipeId ? getRecipe(building.recipeId) : undefined;

  const progressPct = currentRecipe ? (building.progressMs / currentRecipe.durationMs) * 100 : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={[styles.colorChip, { backgroundColor: spec.color }]} />
        <Text style={styles.title}>{spec.label}</Text>
        <Pressable style={styles.closeBtn} onPress={() => select(null)}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.desc}>{spec.description}</Text>
      <View style={styles.statRow}>
        <Stat label="Power" value={spec.powerDraw === 0 ? "—" : `${spec.powerDraw > 0 ? "-" : "+"}${Math.abs(spec.powerDraw)} MW`} />
        <Stat label="Pos" value={`${building.x},${building.y}`} />
      </View>

      {currentRecipe && (
        <View style={styles.progressBox}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(building.progressMs / 100) / 10}s / {currentRecipe.durationMs / 1000}s
          </Text>
        </View>
      )}

      {availableRecipes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECIPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              style={[styles.recipeChip, !building.recipeId && styles.recipeActive]}
              onPress={() => setRecipe(building.id, undefined)}
            >
              <Text style={styles.recipeText}>None</Text>
            </Pressable>
            {availableRecipes.map((r) => (
              <Pressable
                key={r.id}
                style={[styles.recipeChip, building.recipeId === r.id && styles.recipeActive]}
                onPress={() => setRecipe(building.id, r.id)}
              >
                <Text style={styles.recipeText}>{formatRecipe(r)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <BufferRow label="IN" buf={building.inputBuf} />
      <BufferRow label="OUT" buf={building.outputBuf} />

      <Pressable style={styles.removeBtn} onPress={() => removeBuilding(building.id)}>
        <Text style={styles.removeText}>Remove building</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function BufferRow({ label, buf }: { label: string; buf: Partial<Record<ItemId, number>> }) {
  const items = Object.entries(buf).filter(([, n]) => (n ?? 0) > 0) as [ItemId, number][];
  return (
    <View style={styles.bufRow}>
      <Text style={styles.bufLabel}>{label}</Text>
      {items.length === 0 ? (
        <Text style={styles.bufEmpty}>empty</Text>
      ) : (
        items.map(([k, n]) => (
          <View key={k} style={styles.bufChip}>
            <View style={[styles.bufDot, { backgroundColor: ITEM_COLOR[k] }]} />
            <Text style={styles.bufText}>
              {ITEM_LABEL[k]} × {n}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function formatRecipe(r: { inputs: any; outputs: any }): string {
  const ins = Object.entries(r.inputs)
    .map(([k, n]) => `${n}× ${ITEM_LABEL[k as ItemId] ?? k}`)
    .join(" + ");
  const outs = Object.entries(r.outputs)
    .map(([k, n]) => `${n}× ${ITEM_LABEL[k as ItemId] ?? k}`)
    .join(" + ");
  return ins ? `${ins} → ${outs}` : outs;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 80,
    left: 12,
    right: 12,
    backgroundColor: "rgba(14,18,30,0.97)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.25)",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  colorChip: { width: 14, height: 14, borderRadius: 4 },
  title: { color: "#fff", fontWeight: "700", fontSize: 16, flex: 1 },
  closeBtn: { padding: 4 },
  closeText: { color: "#9ca3af", fontSize: 18, lineHeight: 18 },
  desc: { color: "#9ca3af", fontSize: 12, lineHeight: 16 },
  statRow: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 8,
    borderRadius: 6,
  },
  statLabel: { color: "#6b7180", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  statValue: { color: "#fff", fontSize: 13, marginTop: 2, fontVariant: ["tabular-nums"] },
  progressBox: { gap: 4 },
  progressBg: { height: 6, backgroundColor: "#1e2333", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#fde68a" },
  progressText: { color: "#9ca3af", fontSize: 10, alignSelf: "flex-end" },
  section: { gap: 6 },
  sectionLabel: { color: "#6b7180", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  recipeChip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  recipeActive: { borderColor: "#fde68a", backgroundColor: "rgba(253,230,138,0.12)" },
  recipeText: { color: "#e5e7eb", fontSize: 11 },
  bufRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  bufLabel: { color: "#6b7180", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginRight: 4 },
  bufEmpty: { color: "#4b5061", fontSize: 11, fontStyle: "italic" },
  bufChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bufDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  bufText: { color: "#e5e7eb", fontSize: 11 },
  removeBtn: {
    backgroundColor: "#7f1d1d",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  removeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
