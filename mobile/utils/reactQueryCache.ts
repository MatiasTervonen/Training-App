import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useReactQueryCache() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    });

    return unsubscribe;
  }, [queryClient]);
}
