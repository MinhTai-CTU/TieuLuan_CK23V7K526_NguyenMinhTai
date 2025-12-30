import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://sandbox.goship.io/api/v2/cities";

// GET /api/goship/cities - Get all cities
export async function GET(request: NextRequest) {
  try {
    const GOSHIP_TOKEN = process.env.GOSHIP_TOKEN;

    if (!GOSHIP_TOKEN) {
      return NextResponse.json(
        {
          message: "GOSHIP_TOKEN is not configured",
          error: "Missing GOSHIP_TOKEN in environment variables",
        },
        { status: 500 }
      );
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GOSHIP_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching cities:", error.message);
    return NextResponse.json(
      {
        message: "Lỗi khi gọi API cities",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
