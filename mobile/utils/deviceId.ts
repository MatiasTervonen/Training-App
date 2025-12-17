import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export async function getDeviceId() {
  const key = "device_id";

  let id = await AsyncStorage.getItem(key);

  if (!id) {
    id = Crypto.randomUUID();

    await AsyncStorage.setItem(key, id);
  }

  return id;
}
