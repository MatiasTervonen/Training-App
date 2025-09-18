import { NextResponse } from "next/server";
import { guestLoginMobile } from "@/app/login/guest-login/actionMobile";

export async function POST() {
  try {
    const result = await guestLoginMobile();
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: "Guest login failed" },
      { status: 500 }
    );
  }
}
