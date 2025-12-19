import { NextResponse } from "next/server"

// Diagnostic endpoint to check if environment variables are configured
// This helps debug deployment issues
export async function GET() {
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL
  const NEXT_PUBLIC_GA_ID = process.env.NEXT_PUBLIC_GA_ID

  return NextResponse.json({
    configured: {
      googleSheets: !!GOOGLE_SCRIPT_URL,
      googleAnalytics: !!NEXT_PUBLIC_GA_ID,
    },
    // Don't expose the actual URLs for security
    googleSheetsUrlLength: GOOGLE_SCRIPT_URL?.length || 0,
    googleAnalyticsIdLength: NEXT_PUBLIC_GA_ID?.length || 0,
    environment: process.env.NODE_ENV,
  })
}
