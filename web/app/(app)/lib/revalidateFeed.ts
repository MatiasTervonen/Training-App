import { unstable_serialize } from "swr/infinite";
import { getFeedKey } from "../lib/feedKeys";
import { fetcher } from "../lib/fetcher";
import { mutate } from "swr";

export async function updateFeed() {
  const key = unstable_serialize(getFeedKey);
  const page1 = await fetcher(getFeedKey(0, null)!);
  await mutate(key, [page1], false); // overwrite with fresh data
}