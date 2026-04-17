import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const baseUrl = process.env.API_BASE_URL;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!baseUrl || !adminKey) {
      return NextResponse.json(
        { ok: false, error: "API_BASE_URL or ADMIN_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(`${baseUrl}/admin/assign-perpetual-license`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to assign perpetual license" },
      { status: 500 }
    );
  }
}