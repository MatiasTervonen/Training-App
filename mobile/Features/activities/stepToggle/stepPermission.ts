import { initialize, getGrantedPermissions } from "react-native-health-connect";

export async function hasStepsPermission(): Promise<boolean> {
  const initialized = await initialize();
  if (!initialized) return false;

  const permissions = await getGrantedPermissions();

  return permissions.some(
    (p) => p.recordType === "Steps" && p.accessType === "read"
  );
}
