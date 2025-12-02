import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders - Get all orders (with optional userId filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        shipping: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
      },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, items, shipping, total } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order items are required',
        },
        { status: 400 }
      )
    }

    if (!total) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total is required',
        },
        { status: 400 }
      )
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const order = await prisma.order.create({
      data: {
        orderId,
        userId: userId || null,
        total: parseFloat(total),
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            discountedPrice: item.discountedPrice
              ? parseFloat(item.discountedPrice)
              : null,
          })),
        },
        ...(shipping && {
          shipping: {
            create: {
              fullName: shipping.fullName,
              email: shipping.email,
              phone: shipping.phone || null,
              address: shipping.address,
              city: shipping.city,
              postalCode: shipping.postalCode || null,
              country: shipping.country,
              method: shipping.method || null,
            },
          },
        }),
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        shipping: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

