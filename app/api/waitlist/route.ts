import { NextRequest, NextResponse } from "next/server"

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

    // Create timestamp
    const timestamp = new Date().toISOString()

    // Prepare data for Google Sheets
    const sheetData = {
      email,
      signupType,
      page,
      timestamp,
    }

    // Option 1: Send to Google Apps Script Webhook (recommended - see setup instructions below)
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL

    if (GOOGLE_SCRIPT_URL) {
      try {
        console.log("[Waitlist API] Sending to Google Sheets:", sheetData)
        console.log("[Waitlist API] Google Script URL configured:", !!GOOGLE_SCRIPT_URL)
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sheetData),
        })

        const responseText = await response.text()
        console.log("[Waitlist API] Google Sheets response status:", response.status)
        console.log("[Waitlist API] Google Sheets response:", responseText)

        if (!response.ok) {
          console.error("[Waitlist API] Failed to write to Google Sheets:", responseText)
          // Still return success to user, but log error for debugging
        } else {
          console.log("[Waitlist API] Successfully wrote to Google Sheets")
        }
      } catch (error) {
        console.error("[Waitlist API] Error sending to Google Sheets:", error)
        // Log the full error for debugging
        if (error instanceof Error) {
          console.error("[Waitlist API] Error message:", error.message)
          console.error("[Waitlist API] Error stack:", error.stack)
        }
        // Still return success to user
      }
    } else {
      // Log to console if no webhook is configured
      console.warn("[Waitlist API] Google Sheets not configured - GOOGLE_SCRIPT_URL environment variable is missing")
      console.log("[Waitlist API] Waitlist signup data (not saved to Google Sheets):", sheetData)
    }

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
