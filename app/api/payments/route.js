import { NextResponse } from "next/server";

// Disabled: the old stub always reported success. Use /api/create-order and /api/verify-payment.
export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
