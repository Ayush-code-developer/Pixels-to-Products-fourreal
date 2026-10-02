import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages that need a signed-in user
const PROTECTED = ["/studio", "/box"];

// The sign in / register / recovery page
const AUTH_PAGE = "/login";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Don't put code between createServerClient and getClaims():
  // this call is what refreshes an expiring session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, searchParams } = request.nextUrl;

  // Redirects must carry any refreshed session cookies along
  const redirect = (to: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = search;
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!signedIn && isProtected) {
    return redirect(AUTH_PAGE, `?next=${encodeURIComponent(pathname)}`);
  }

  // Signed-in users skip the login screen, except during password recovery
  // (the recovery link signs them in so they can set a new key).
  if (
  signedIn &&
  pathname === AUTH_PAGE &&
  searchParams.get("mode") !== "recovery"
) {
  return redirect("/studio");
}

  return response;
}