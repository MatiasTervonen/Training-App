import { NextResponse } from "next/server";
import { handleError } from "../../utils/handleError";
import getSession from "@/app/(app)/lib/getSession";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    console.log("API feed called with limit:", limit, "page:", page);

    const { feed, nextPage, error } = await getSession({ req, page, limit });

    if (error) {
      const status = error.message === "Unauthorized" ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

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
