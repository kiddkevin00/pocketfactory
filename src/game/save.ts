import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "./types";

const KEY = "pocketfactory:save:v1";

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

export async function clearSave(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
