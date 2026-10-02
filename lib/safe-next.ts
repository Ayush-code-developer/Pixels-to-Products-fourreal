/** Only allow redirects to paths inside this app. */
export function safeNext(next?: string | null, fallback = "/studio") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}