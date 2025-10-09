import { NextResponse } from "next/server";
import { handleError } from "../../utils/handleError";
import getSession from "@/app/(app)/lib/getSession";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const { feed, nextPage } = await getSession({ page, limit });

    return NextResponse.json({ feed, nextPage: nextPage });
  } catch (error) {
    handleError(error, {
      message: "Failed to fetch feed",
      route: "/api/feed",
      method: "GET",
    });
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
