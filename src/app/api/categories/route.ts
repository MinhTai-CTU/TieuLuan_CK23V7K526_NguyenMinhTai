import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, img, description } = body

    if (!title || !slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and slug are required',
        },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        title,
        slug,
        img: img || null,
        description: description || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating category:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Category with this slug already exists',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
      },
      { status: 500 }
    )
  }
}

