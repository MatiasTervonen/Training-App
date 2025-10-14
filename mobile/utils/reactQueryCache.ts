import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useReactQueryCache() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      console.log(" React Query cache event:", event?.type);
      console.log(" Current cache:", queryClient.getQueryData(["feed"]));
    });

    return unsubscribe;
  }, [queryClient]);
}
