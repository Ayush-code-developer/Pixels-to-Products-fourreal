import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  let next =
    requestUrl.searchParams.get("next") ?? "/login";

  // Only allow relative internal redirects.
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/login";
  }

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        new URL(next, requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=callback",
      requestUrl.origin,
    ),
  );
}