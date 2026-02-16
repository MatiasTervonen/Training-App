import { useQuery } from "@tanstack/react-query";
import { getFolders } from "@/database/notes/get-folders";

export default function useFolders() {
  const { data: folders = [], isLoading, error } = useQuery({
    queryKey: ["folders"],
    queryFn: getFolders,
  });

  return { folders, isLoading, error };
}
