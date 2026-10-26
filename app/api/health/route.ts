import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness endpoint for uptime checks. It intentionally does not expose
 * database state, environment values, or application internals.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "vapeshop",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
