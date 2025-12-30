import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://sandbox.goship.io/api/v2/rates";

// POST /api/goship/rates - Get shipping rates
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${GOSHIP_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching rates:", error.message);
    return NextResponse.json(
      {
        message: "Lỗi khi lấy rates",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
