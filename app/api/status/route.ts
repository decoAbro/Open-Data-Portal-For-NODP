import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Try to connect to your API to check status
    const response = await fetch("http://172.16.17.101:5000/upload_data", {
      method: "HEAD", // Use HEAD to just check if server is responding
    })

    if (response.ok || response.status === 405) {
      // 405 is method not allowed, but server is responding
      return NextResponse.json({ status: "online" })
    } else {
      return NextResponse.json({ status: "offline" }, { status: 503 })
    }
  } catch (error) {
    return NextResponse.json({ status: "offline" }, { status: 503 })
  }
}
