export function getRelyingPartyConfig(req: Request) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  const hostname = host.split(":")[0];
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const protocol =
    req.headers.get("x-forwarded-proto") || (isLocal ? "http" : "https");
  const fallbackOrigin = `${protocol}://${host}`;
  const originHeader = req.headers.get("origin");

  const origins = Array.from(
    new Set([fallbackOrigin, originHeader].filter(Boolean) as string[])
  );

  return {
    rpName: "Apex Digital Bank",
    rpID: hostname,
    origin: origins.length === 1 ? origins[0] : origins,
  };
}
