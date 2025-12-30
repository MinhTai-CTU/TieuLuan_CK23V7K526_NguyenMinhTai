import { NextRequest, NextResponse } from "next/server";

// GET /api/goship/cities/[code]/districts - Get districts by city id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
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

    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { message: "City id is required" },
        { status: 400 }
      );
    }

    const API_URL = `https://sandbox.goship.io/api/v2/cities/${code}/districts`;

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${GOSHIP_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching districts:", error.message);
    return NextResponse.json(
      {
        message: "Lỗi khi lấy danh sách districts",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
