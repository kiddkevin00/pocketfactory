import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Animated, Easing } from "react-native";
import { useGameStore } from "../store/useGameStore";
import { ACHIEVEMENTS } from "../game/achievements";

export function AchievementsModal() {
  const show = useGameStore((s) => s.showAchievements);
  const close = useGameStore((s) => s.toggleAchievementsPanel);
  const unlocked = useGameStore((s) => s.unlockedAchievements);

  return (
    <Modal visible={show} transparent animationType="fade" onRequestClose={() => close(false)}>
      <Pressable style={styles.backdrop} onPress={() => close(false)}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>ACHIEVEMENTS</Text>
            <Text style={styles.count}>
              {unlocked.length}/{ACHIEVEMENTS.length}
            </Text>
            <Pressable onPress={() => close(false)}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {ACHIEVEMENTS.map((a) => {
              const got = unlocked.includes(a.id);
              return (
                <View key={a.id} style={[styles.row, got && styles.rowGot]}>
                  <Text style={[styles.medal, got && styles.medalGot]}>{got ? "★" : "☆"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, !got && { color: "#6b7180" }]}>{a.label}</Text>
                    <Text style={styles.rowDesc}>{a.desc}</Text>
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

export function AchievementToast() {
  const recent = useGameStore((s) => s.recentAchievement);
  const clear = useGameStore((s) => s.clearRecentAchievement);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!recent) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 350, useNativeDriver: true }),
      ]).start(() => clear());
    }, 2400);
    return () => clearTimeout(t);
  }, [recent]);

  if (!recent) return null;
  return (
    <Animated.View style={[styles.toastWrap, { opacity, transform: [{ translateY }], pointerEvents: "none" }]}>
      <View style={styles.toast}>
        <Text style={styles.toastMedal}>★</Text>
        <View>
          <Text style={styles.toastTag}>ACHIEVEMENT UNLOCKED</Text>
          <Text style={styles.toastLabel}>{recent.label}</Text>
        </View>
      </View>
    </Animated.View>
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
    borderColor: "rgba(253,230,138,0.4)",
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { color: "#fff", fontWeight: "800", fontSize: 18, letterSpacing: 2, flex: 1 },
  count: { color: "#fde68a", fontWeight: "700", fontSize: 14, fontVariant: ["tabular-nums"] },
  close: { color: "#9ca3af", fontSize: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  rowGot: { borderColor: "rgba(253,230,138,0.4)", backgroundColor: "rgba(253,230,138,0.06)" },
  medal: { color: "#3a4055", fontSize: 26, width: 32, textAlign: "center" },
  medalGot: { color: "#fde68a" },
  rowTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  rowDesc: { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  toastWrap: {
    position: "absolute",
    top: 140,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(15,19,32,0.97)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.6)",
    boxShadow: "0px 0px 16px rgba(253,230,138,0.3)",
  },
  toastMedal: { color: "#fde68a", fontSize: 24 },
  toastTag: { color: "#fde68a", fontWeight: "800", fontSize: 9, letterSpacing: 1.5 },
  toastLabel: { color: "#fff", fontWeight: "700", fontSize: 14, marginTop: 1 },
});
