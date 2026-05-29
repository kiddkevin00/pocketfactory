import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "./types";

const KEY = "pocketfactory:save:v1";
const META_KEY = "pocketfactory:meta:v1";
const SAVE_VERSION = 1;

export type SaveMeta = { tutorialDismissed: boolean; unlockedAchievements?: string[] };

export async function saveGame(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("save failed", e);
  }
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    // Save schema mismatch: drop it rather than crash with a half-shape.
    if (!parsed || parsed.version !== SAVE_VERSION) return null;
    // Defensive defaults for fields that might be missing from older snapshots.
    if (!parsed.power || typeof parsed.power.baseline !== "number") {
      parsed.power = { generated: 50, drawn: 0, baseline: 50 };
    }
    return parsed;
  } catch (e) {
    console.warn("load failed", e);
    return null;
  }
}

export async function saveMeta(meta: SaveMeta): Promise<void> {
  try {
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn("meta save failed", e);
  }
}

export async function loadMeta(): Promise<SaveMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as SaveMeta) : null;
  } catch {
    return null;
  }
}

export async function clearSave(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  await AsyncStorage.removeItem(META_KEY);
}
