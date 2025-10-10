import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { handleError } from "@/app/(app)/utils/handleError";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    console.log("verifyOtp input", { type, token_hash });
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      handleError(error, {
        message: "Error confirming email",
        route: "/api/auth/confirm",
        method: "GET",
      });
    }

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL(next, request.url));
      } else {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/email-verified", request.url));
      }
    }
  }

  // redirect the user to an error page with some instructions
  return NextResponse.redirect(new URL("/error", request.url));
}
