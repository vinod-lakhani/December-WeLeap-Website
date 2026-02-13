import { NextRequest, NextResponse } from "next/server"
import { submitToWaitlist } from "@/lib/waitlist"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, signupType, page } = body

    // Validate required fields
    if (!email || !signupType || !page) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await submitToWaitlist({ email, signupType, page })

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
