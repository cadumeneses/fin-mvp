import AsyncStorage from "@react-native-async-storage/async-storage";

export type ProfileData = {
  name?: string;
  email?: string;
};

export const PROFILE_STORAGE_KEY = "profile-data";

export async function loadProfileData(): Promise<ProfileData | null> {
  const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
  if (!stored) return null;
  return JSON.parse(stored) as ProfileData;
}

export async function saveProfileData(data: ProfileData): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
}
