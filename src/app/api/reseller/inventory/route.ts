import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const resellerCompanyId = req.nextUrl.searchParams.get("resellerCompanyId");

    if (!resellerCompanyId) {
      return NextResponse.json(
        { ok: false, error: "resellerCompanyId query parameter is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.API_BASE_URL;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!baseUrl || !adminKey) {
      return NextResponse.json(
        { ok: false, error: "API_BASE_URL or ADMIN_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${baseUrl}/admin/perpetual-inventory?resellerCompanyId=${encodeURIComponent(
        resellerCompanyId
      )}`,
      {
        headers: {
          "x-admin-key": adminKey,
        },
        cache: "no-store",
      }
    );

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load reseller inventory" },
      { status: 500 }
    );
  }
}