import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  let next = requestUrl.searchParams.get("next") ?? "/login?verified=1";

  // Only allow internal redirects.
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/login?verified=1";
  }

  const redirectTo = new URL(next, requestUrl.origin);

  if (tokenHash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation", requestUrl.origin),
  );
}