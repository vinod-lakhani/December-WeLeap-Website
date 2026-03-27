import { NextRequest, NextResponse } from "next/server"
import { submitToWaitlist } from "@/lib/waitlist"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, signupType, page, ref, source, referrer } = body

    // Validate required fields
    if (!email || !signupType || !page) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Prefer client `document.referrer` when sent (including "" for direct traffic).
    // If omitted (server-side fetch), fall back to the incoming Referer header.
    const httpReferrer =
      typeof referrer === "string"
        ? referrer
        : request.headers.get("referer") || ""

    await submitToWaitlist({
      email,
      signupType,
      page,
      ref,
      source: typeof source === "string" ? source : undefined,
      referrer: httpReferrer,
    })

    return NextResponse.json(
      { success: true, message: "Successfully joined waitlist" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error processing waitlist signup:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
