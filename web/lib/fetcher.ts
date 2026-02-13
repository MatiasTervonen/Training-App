import { handleError } from "@/utils/handleError";

export const fetcher = async <T>(url: string): Promise<T> => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Fetch error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    handleError(error, {
      route: url, 
      method: "GET", 
      message: `Fetcher error at ${url}`,
    });
    throw error;
  }
};
