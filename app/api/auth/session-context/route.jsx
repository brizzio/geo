import { NextResponse } from "next/server";
import { headers } from "next/headers";

function extractIpAddress(requestHeaders) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = requestHeaders.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return null;
}

export async function GET() {
  const requestHeaders = headers();
  const ipAddress = extractIpAddress(requestHeaders);
  const userAgent = requestHeaders.get("user-agent") || null;

  return NextResponse.json({
    ipAddress,
    userAgent
  });
}
