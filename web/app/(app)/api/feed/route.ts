import { NextResponse } from "next/server";
import { getFeed } from "../../lib/data";
import { handleError } from "../../utils/handleError";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const data = await getFeed(page, limit);

    return NextResponse.json(data);
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
