import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useGameStore, Tool } from "../store/useGameStore";
import { BUILDINGS } from "../game/buildings";
import { BuildingKind } from "../game/types";

const ORDER: BuildingKind[] = ["miner", "smelter", "constructor", "assembler", "coal_gen", "storage"];

export function Toolbar() {
  const tool = useGameStore((s) => s.tool);
  const setTool = useGameStore((s) => s.setTool);
  const research = useGameStore((s) => s.state.research);

  function isActive(t: Tool): boolean {
    if (tool.kind !== t.kind) return false;
    if (tool.kind === "build" && t.kind === "build") return tool.building === t.building;
    return true;
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ToolButton
          label="Pan"
          active={tool.kind === "none"}
          onPress={() => setTool({ kind: "none" })}
          color="#374151"
        />
        {ORDER.map((k) => {
          const spec = BUILDINGS[k];
          const locked = !!spec.requires && !research.includes(spec.requires);
          return (
            <ToolButton
              key={k}
              label={spec.label}
              active={isActive({ kind: "build", building: k })}
              onPress={() => setTool({ kind: "build", building: k })}
              color={spec.color}
              locked={locked}
              sub={spec.powerDraw > 0 ? `-${spec.powerDraw} MW` : spec.powerDraw < 0 ? `+${-spec.powerDraw} MW` : undefined}
            />
          );
        })}
        <ToolButton
          label="Belt"
          active={tool.kind === "belt"}
          onPress={() => setTool({ kind: "belt" })}
          color="#3a4660"
        />
        <ToolButton
          label="Remove"
          active={tool.kind === "remove"}
          onPress={() => setTool({ kind: "remove" })}
          color="#7f1d1d"
        />
      </ScrollView>
    </View>
  );
}

function ToolButton({
  label,
  active,
  onPress,
  color,
  locked,
  sub,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
  locked?: boolean;
  sub?: string;
}) {
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      style={[
        styles.btn,
        { backgroundColor: locked ? "#1f2533" : color },
        active && styles.active,
        locked && styles.locked,
      ]}
    >
      <Text style={[styles.btnLabel, locked && { color: "#5b6273" }]}>{locked ? "🔒 " : ""}{label}</Text>
      {sub && !locked && <Text style={styles.btnSub}>{sub}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  scroll: { gap: 8, paddingHorizontal: 4 },
  btn: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  active: { borderColor: "#fde68a", borderWidth: 2 },
  locked: { opacity: 0.7 },
  btnLabel: { color: "#fff", fontWeight: "700", fontSize: 12 },
  btnSub: { color: "rgba(255,255,255,0.85)", fontSize: 9, marginTop: 2 },
});
