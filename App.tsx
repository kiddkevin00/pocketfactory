import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, AppState, LayoutChangeEvent } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { startGameLoop, stopGameLoop, loadIfPresent, useGameStore } from "./src/store/useGameStore";
import { saveGame, saveMeta } from "./src/game/save";
import { GameCanvas } from "./src/ui/GameCanvas";
import { HUD } from "./src/ui/HUD";
import { Toolbar } from "./src/ui/Toolbar";
import { BuildingSheet } from "./src/ui/BuildingSheet";
import { ResearchModal } from "./src/ui/ResearchModal";
import { Tutorial } from "./src/ui/Tutorial";
import { AchievementsModal, AchievementToast } from "./src/ui/AchievementsModal";

export default function App() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadIfPresent();
      if (mounted) startGameLoop();
    })();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background" || s === "inactive") {
        const st = useGameStore.getState();
        saveGame(st.state);
        saveMeta({ tutorialDismissed: st.tutorialDismissed, unlockedAchievements: st.unlockedAchievements });
      }
    });
    return () => {
      mounted = false;
      stopGameLoop();
      sub.remove();
    };
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.fill} edges={["top", "bottom", "left", "right"]}>
          <View style={styles.fill} onLayout={onLayout}>
            {size && <GameCanvas width={size.w} height={size.h} />}
            <HUD />
            <Tutorial />
            <BuildingSheet />
            <Toolbar />
            <ResearchModal />
            <AchievementsModal />
            <AchievementToast />
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06080f" },
  fill: { flex: 1, backgroundColor: "#06080f" },
});
