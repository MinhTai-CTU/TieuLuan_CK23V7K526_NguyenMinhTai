import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/testimonials - Get all active testimonials
export async function GET(request: NextRequest) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch testimonials",
      },
      { status: 500 }
    );
  }
}

// POST /api/testimonials - Create a new testimonial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { review, authorName, authorRole, authorImg } = body;

    if (!review || !authorName) {
      return NextResponse.json(
        {
          success: false,
          error: "Review and author name are required",
        },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        review,
        authorName,
        authorRole: authorRole || null,
        authorImg: authorImg || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: testimonial,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating testimonial:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create testimonial",
      },
      { status: 500 }
    );
  }
}
