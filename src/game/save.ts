import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "./types";

const KEY = "pocketfactory:save:v1";
const META_KEY = "pocketfactory:meta:v1";

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
    return JSON.parse(raw) as GameState;
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
