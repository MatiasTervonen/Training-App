import { useQuery } from "@tanstack/react-query";
import { getSharingDefaults } from "@/database/sharing/get-sharing-defaults";

export default function useSharingDefaults() {
  return useQuery({
    queryKey: ["sharing-defaults"],
    queryFn: getSharingDefaults,
  });
}
