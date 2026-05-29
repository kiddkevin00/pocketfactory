import React, { useRef, useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import Svg, { G, Rect, Circle, Line, Polyline, Path, Text as SvgText } from "react-native-svg";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { useGameStore } from "../store/useGameStore";
import { BUILDINGS } from "../game/buildings";
import { ITEM_COLOR } from "../game/recipes";
import { Belt, Building, ResourceNode } from "../game/types";

const TILE = 36;

const NODE_COLOR: Record<string, string> = {
  iron_ore: "#94a3b8",
  copper_ore: "#dc7a3d",
  coal: "#1e293b",
};

const NODE_LABEL: Record<string, string> = {
  iron_ore: "Fe",
  copper_ore: "Cu",
  coal: "C",
};

type Props = { width: number; height: number };

export function GameCanvas({ width, height }: Props) {
  const state = useGameStore((s) => s.state);
  const tool = useGameStore((s) => s.tool);
  const selectedId = useGameStore((s) => s.selectedBuildingId);
  const placeAt = useGameStore((s) => s.placeAt);
  const selectBuilding = useGameStore((s) => s.selectBuilding);
  const removeBuilding = useGameStore((s) => s.removeBuilding);
  const connectBuildings = useGameStore((s) => s.connectBuildings);
  const setTool = useGameStore((s) => s.setTool);
  const deleteBelt = useGameStore((s) => s.deleteBelt);

  // Start centered on the iron-ore cluster (around tile 6,6).
  const initialTx = width / 2 - 7 * TILE;
  const initialTy = height / 2 - 8 * TILE;
  const tx = useSharedValue(initialTx);
  const ty = useSharedValue(initialTy);
  const scale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);
  const startScale = useSharedValue(1);

  // Keep at least one tile of world peeking onto the viewport so the user can't lose the map.
  function clampPan(x: number, y: number, s: number): { x: number; y: number } {
    "worklet";
    const worldW = state.worldW * TILE * s;
    const worldH = state.worldH * TILE * s;
    const minX = width - worldW - TILE;
    const maxX = TILE;
    const minY = height - worldH - TILE;
    const maxY = TILE;
    return {
      x: Math.max(Math.min(x, maxX), minX),
      y: Math.max(Math.min(y, maxY), minY),
    };
  }

  function recenter() {
    tx.value = initialTx;
    ty.value = initialTy;
    scale.value = 1;
  }

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onBegin(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      const clamped = clampPan(
        startTx.value + e.translationX,
        startTy.value + e.translationY,
        scale.value,
      );
      tx.value = clamped.x;
      ty.value = clamped.y;
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      const s = Math.max(0.5, Math.min(2.5, startScale.value * e.scale));
      scale.value = s;
    });

  // Tap to place / select.
  const tap = Gesture.Tap()
    .maxDuration(400)
    .maxDistance(8)
    .onEnd((e) => {
      const localX = (e.x - tx.value) / scale.value;
      const localY = (e.y - ty.value) / scale.value;
      const tileX = Math.floor(localX / TILE);
      const tileY = Math.floor(localY / TILE);
      runOnJS(handleTap)(tileX, tileY);
    });

  function handleTap(x: number, y: number) {
    const hit = Object.values(state.buildings).find((b) => b.x === x && b.y === y);
    if (tool.kind === "build") {
      if (hit) {
        showToast("Tile occupied");
        return;
      }
      const res = placeAt(tool.building, x, y);
      if (!res.ok) showToast(res.reason ?? "Cannot place");
      return;
    }
    if (tool.kind === "remove") {
      if (hit) {
        removeBuilding(hit.id);
        showToast("Removed");
      } else {
        // try delete belt at tile
        const belt = Object.values(state.belts).find((b) =>
          b.path.some((p) => p.x === x && p.y === y),
        );
        if (belt) {
          deleteBelt(belt.id);
          showToast("Belt removed");
        }
      }
      return;
    }
    if (tool.kind === "belt") {
      if (!hit) {
        showToast("Tap a building");
        return;
      }
      if (!tool.fromId) {
        if (BUILDINGS[hit.kind].outputs === 0) {
          showToast("That building has no output");
          return;
        }
        setTool({ kind: "belt", fromId: hit.id });
        showToast("Now tap destination");
        return;
      }
      if (tool.fromId === hit.id) {
        setTool({ kind: "belt" });
        showToast("Cancelled");
        return;
      }
      if (BUILDINGS[hit.kind].inputs === 0) {
        showToast("That building has no input");
        return;
      }
      const ok = connectBuildings(tool.fromId, hit.id);
      showToast(ok ? "Belt placed" : "Cannot connect");
      setTool({ kind: "belt" });
      return;
    }
    // none / default: select
    if (hit) selectBuilding(hit.id);
    else selectBuilding(null);
  }

  const composed = Gesture.Simultaneous(pan, pinch, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const worldPx = state.worldW * TILE;
  const worldPy = state.worldH * TILE;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.canvas, { width, height }]}>
        <GestureDetector gesture={composed}>
          <Animated.View style={[{ width: worldPx, height: worldPy }, animatedStyle]}>
            <Svg width={worldPx} height={worldPy}>
              <Grid w={state.worldW} h={state.worldH} />
              {state.nodes.map((n, i) => (
                <NodeShape key={i} n={n} />
              ))}
              {Object.values(state.belts).map((b) => (
                <BeltShape key={b.id} belt={b} />
              ))}
              {Object.values(state.buildings).map((b) => (
                <BuildingShape
                  key={b.id}
                  b={b}
                  selected={b.id === selectedId || (tool.kind === "belt" && tool.fromId === b.id)}
                />
              ))}
            </Svg>
          </Animated.View>
        </GestureDetector>
        {toast && (
          <View style={[styles.toast, { pointerEvents: "none" }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
        <Pressable style={styles.recenterBtn} onPress={recenter} hitSlop={8}>
          <Text style={styles.recenterText}>⊕</Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

function Grid({ w, h }: { w: number; h: number }) {
  const lines = [];
  for (let i = 0; i <= w; i++) {
    lines.push(
      <Line
        key={"v" + i}
        x1={i * TILE}
        y1={0}
        x2={i * TILE}
        y2={h * TILE}
        stroke="#1c2030"
        strokeWidth={1}
      />,
    );
  }
  for (let j = 0; j <= h; j++) {
    lines.push(
      <Line
        key={"h" + j}
        x1={0}
        y1={j * TILE}
        x2={w * TILE}
        y2={j * TILE}
        stroke="#1c2030"
        strokeWidth={1}
      />,
    );
  }
  return (
    <G>
      <Rect x={0} y={0} width={w * TILE} height={h * TILE} fill="#0b0e16" />
      {lines}
    </G>
  );
}

function NodeShape({ n }: { n: ResourceNode }) {
  const cx = n.x * TILE + TILE / 2;
  const cy = n.y * TILE + TILE / 2;
  const color = NODE_COLOR[n.kind];
  return (
    <G>
      <Circle cx={cx} cy={cy} r={TILE / 2 - 2} fill={color} opacity={0.35} />
      <Circle cx={cx} cy={cy} r={TILE / 2 - 7} fill={color} opacity={0.95} />
      <SvgText
        x={cx}
        y={cy + 3}
        fontSize={9}
        fontWeight="700"
        fill="#fff"
        textAnchor="middle"
        opacity={0.9}
      >
        {NODE_LABEL[n.kind]}
      </SvgText>
    </G>
  );
}

function BuildingShape({ b, selected }: { b: Building; selected: boolean }) {
  const spec = BUILDINGS[b.kind];
  const px = b.x * TILE;
  const py = b.y * TILE;
  return (
    <G>
      <Rect
        x={px + 2}
        y={py + 2}
        width={TILE - 4}
        height={TILE - 4}
        rx={6}
        fill={spec.color}
        stroke={selected ? "#fde68a" : "rgba(255,255,255,0.18)"}
        strokeWidth={selected ? 3 : 1}
      />
      <BuildingGlyph kind={b.kind} cx={px + TILE / 2} cy={py + TILE / 2} />
    </G>
  );
}

function BuildingGlyph({ kind, cx, cy }: { kind: Building["kind"]; cx: number; cy: number }) {
  // Tiny iconography: distinct shapes per kind, all in white-ish.
  const s = 8;
  switch (kind) {
    case "miner":
      return <Path d={`M${cx - s} ${cy + s} L${cx} ${cy - s} L${cx + s} ${cy + s} Z`} fill="#fff" opacity={0.95} />;
    case "smelter":
      return <Circle cx={cx} cy={cy} r={s - 1} fill="#fff" opacity={0.95} />;
    case "constructor":
      return <Rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill="#fff" opacity={0.95} rx={2} />;
    case "assembler":
      return (
        <G>
          <Rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill="#fff" opacity={0.95} rx={2} />
          <Rect x={cx - 3} y={cy - 3} width={6} height={6} fill="#8b5cf6" />
        </G>
      );
    case "coal_gen":
      return (
        <G>
          <Path d={`M${cx} ${cy - s} L${cx + s / 1.5} ${cy} L${cx} ${cy + s} L${cx - s / 1.5} ${cy} Z`} fill="#fff" opacity={0.95} />
        </G>
      );
    case "storage":
      return (
        <G>
          <Rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill="none" stroke="#fff" strokeWidth={2} />
          <Line x1={cx - s} y1={cy} x2={cx + s} y2={cy} stroke="#fff" strokeWidth={1.5} />
        </G>
      );
  }
}

function BeltShape({ belt }: { belt: Belt }) {
  const pts = belt.path.map((p) => `${p.x * TILE + TILE / 2},${p.y * TILE + TILE / 2}`).join(" ");
  // compute interpolated positions for items
  const totalSegLengths = computeSegLengths(belt.path);
  const total = totalSegLengths[totalSegLengths.length - 1];
  return (
    <G>
      <Polyline
        points={pts}
        fill="none"
        stroke="#3a4660"
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Polyline
        points={pts}
        fill="none"
        stroke="#5b6b88"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="4,3"
      />
      {belt.items.map((it, i) => {
        const dist = it.t * total;
        const p = pointAtDistance(belt.path, totalSegLengths, dist);
        return (
          <Circle
            key={i}
            cx={p.x * TILE + TILE / 2}
            cy={p.y * TILE + TILE / 2}
            r={5}
            fill={ITEM_COLOR[it.itemId]}
            stroke="#111"
            strokeWidth={0.5}
          />
        );
      })}
    </G>
  );
}

function computeSegLengths(path: { x: number; y: number }[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    out.push(out[i - 1] + Math.hypot(dx, dy));
  }
  return out;
}
function pointAtDistance(
  path: { x: number; y: number }[],
  seg: number[],
  dist: number,
): { x: number; y: number } {
  const total = seg[seg.length - 1];
  if (total === 0) return path[0];
  const d = Math.max(0, Math.min(total, dist));
  for (let i = 1; i < path.length; i++) {
    if (d <= seg[i]) {
      const t = (d - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
      return {
        x: path[i - 1].x + (path[i].x - path[i - 1].x) * t,
        y: path[i - 1].y + (path[i].y - path[i - 1].y) * t,
      };
    }
  }
  return path[path.length - 1];
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: "#06080f",
    overflow: "hidden",
  },
  toast: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  toastText: {
    backgroundColor: "rgba(20,24,36,0.92)",
    color: "#f5f6fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.4)",
  },
  recenterBtn: {
    position: "absolute",
    right: 12,
    top: 200,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(20,24,36,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  recenterText: { color: "#fde68a", fontSize: 20, fontWeight: "700" },
});
