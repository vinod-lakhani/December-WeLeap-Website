import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    // Get Substack publication URL from environment variable
    const SUBSTACK_PUBLICATION_URL = process.env.SUBSTACK_PUBLICATION_URL

    if (!SUBSTACK_PUBLICATION_URL) {
      // If no Substack URL configured, just log the subscription
      console.log("[Subscribe API] New subscription (Substack not configured):", { email, timestamp: new Date().toISOString() })
      
      // Optionally send to Google Sheets (same as waitlist)
      const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL
      if (GOOGLE_SCRIPT_URL) {
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              signupType: "newsletter",
              page: "resources",
              timestamp: new Date().toISOString(),
            }),
          })
        } catch (error) {
          console.error("[Subscribe API] Error sending to Google Sheets:", error)
        }
      }

      return NextResponse.json(
        { success: true, message: "Subscription received" },
        { status: 200 }
      )
    }

    // Construct Substack subscribe URL
    // Format: https://[publication].substack.com/subscribe?email=[email]
    const substackSubscribeUrl = `${SUBSTACK_PUBLICATION_URL}/subscribe?email=${encodeURIComponent(email)}`

    // Log the subscription attempt
    console.log("[Subscribe API] Redirecting to Substack:", { email, url: substackSubscribeUrl })

    // Optionally send to Google Sheets for tracking
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL
    if (GOOGLE_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            signupType: "newsletter",
            page: "resources",
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (error) {
        console.error("[Subscribe API] Error sending to Google Sheets:", error)
      }
    }

    // Return the Substack URL so frontend can redirect
    return NextResponse.json(
      { 
        success: true, 
        message: "Redirecting to Substack",
        redirectUrl: substackSubscribeUrl 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error processing subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
