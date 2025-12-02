import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * OAuth callback API handler
 * Called by the OAuth callback page to get token
 * Returns JWT token to frontend
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      console.error("OAuth callback: No session found");
      return NextResponse.json(
        {
          success: false,
          error: "No session found",
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      console.error("OAuth callback: User not found in database");
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      console.error("OAuth callback: User account is banned");
      return NextResponse.json(
        {
          success: false,
          error: "Account is banned",
        },
        { status: 403 }
      );
    }

    // Get JWT token from session
    const token = (session as any).token;

    if (!token) {
      console.error("OAuth callback: JWT token not found in session");
      return NextResponse.json(
        {
          success: false,
          error: "Token generation failed",
        },
        { status: 500 }
      );
    }

    // Return token
    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "OAuth callback failed",
      },
      { status: 500 }
    );
  }
}
