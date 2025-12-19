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
        console.log("Sending to Google Sheets:", sheetData)
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sheetData),
        })

        const responseText = await response.text()
        console.log("Google Sheets response status:", response.status)
        console.log("Google Sheets response:", responseText)

        if (!response.ok) {
          console.error("Failed to write to Google Sheets:", responseText)
          // Still return success to user, but log error
        } else {
          console.log("Successfully wrote to Google Sheets")
        }
      } catch (error) {
        console.error("Error sending to Google Sheets:", error)
        // Still return success to user
      }
    } else {
      // Log to console if no webhook is configured
      console.log("Waitlist signup (Google Sheets not configured):", sheetData)
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
