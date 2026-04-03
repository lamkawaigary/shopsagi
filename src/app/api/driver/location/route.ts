// Driver Location Update API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, driverId, lat, lng, driverPhone } = body;

    if (!orderId || !driverId || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Update order with driver location
    await updateDoc(doc(db, 'orders', orderId), {
      driverId,
      driverPhone,
      driverLocation: {
        lat,
        lng,
        updatedAt: new Date().toISOString()
      },
      status: 'delivering',
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: '位置已更新'
    });

  } catch (error) {
    console.error('Location update error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// Get order tracking info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { error: 'Missing orderId' },
      { status: 400 }
    );
  }

  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const orderDoc = await doc(db, 'orders', orderId);
    // Note: In a real app, you'd fetch the document here
    
    return NextResponse.json({
      orderId,
      status: 'delivering'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500 }
    );
  }
}