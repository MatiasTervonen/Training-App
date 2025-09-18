import { getFeed } from "@/app/(app)/lib/data";
import SessionFeed from "@/app/(app)/ui/homepage/sessionFeed";

export default async function FeedSection() {
  const initialData = await getFeed(1, 15);

  return <SessionFeed initialData={initialData} />;
}
