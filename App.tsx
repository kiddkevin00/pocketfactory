import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, useWindowDimensions, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { startGameLoop, stopGameLoop, loadIfPresent, useGameStore } from "./src/store/useGameStore";
import { saveGame } from "./src/game/save";
import { GameCanvas } from "./src/ui/GameCanvas";
import { HUD } from "./src/ui/HUD";
import { Toolbar } from "./src/ui/Toolbar";
import { BuildingSheet } from "./src/ui/BuildingSheet";
import { ResearchModal } from "./src/ui/ResearchModal";

export default function App() {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadIfPresent();
      if (mounted) startGameLoop();
    })();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background" || s === "inactive") {
        const st = useGameStore.getState().state;
        saveGame(st);
      }
    });
    return () => {
      mounted = false;
      stopGameLoop();
      sub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.fill}>
        <GameCanvas width={width} height={height} />
        <HUD />
        <BuildingSheet />
        <Toolbar />
        <ResearchModal />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06080f" },
  fill: { flex: 1 },
});
