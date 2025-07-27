import { NextResponse } from "next/server";
import { guestLogin } from "../../login/guest-login/action";

export async function POST() {
  const result = await guestLogin();
  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
