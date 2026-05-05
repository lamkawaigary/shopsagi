import { db } from '@/lib/firebase';
import { collection, addDoc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

// ============================================
// ShopSagi Database Service
// Helper functions for Firestore operations
// ============================================

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  MERCHANTS: 'merchants',
  PRODUCTS: 'products',
  ORDERS: 'orders',
};

// Create a new merchant
export async function createMerchant(userId: string, data: {
  shopName: string;
  description: string;
  phone: string;
  address: string;
  businessHours: string;
  categories: string[];
}) {
  const docRef = await addDoc(collection(db!, COLLECTIONS.MERCHANTS), {
    userId,
    ...data,
    plan: 'free', // Default to free plan
    status: 'pending', // Requires approval or verification
    createdAt: new Date(),
  });
  return docRef.id;
}

// Get merchant by user ID
export async function getMerchantByUserId(userId: string) {
  const q = query(collection(db!, COLLECTIONS.MERCHANTS), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Get all active merchants (for public browsing)
export async function getActiveMerchants() {
  const q = query(
    collection(db!, COLLECTIONS.MERCHANTS),
    where('status', '==', 'active'),
    orderBy('shopName')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get products by merchant
export async function getProductsByMerchant(merchantId: string) {
  const q = query(
    collection(db!, COLLECTIONS.PRODUCTS),
    where('merchantId', '==', merchantId),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Create a new order
export async function createOrder(data: {
  customerName: string;
  customerPhone: string;
  merchantId: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  notes?: string;
}) {
  const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  const docRef = await addDoc(collection(db!, COLLECTIONS.ORDERS), {
    ...data,
    orderNumber: `ORD-${Date.now()}`,
    pickupCode,
    status: 'pending',
    paymentStatus: 'unpaid',
    platformFee: 0,
    total: data.subtotal,
    createdAt: new Date(),
  });
  return docRef.id;
}

// Get orders by merchant
export async function getOrdersByMerchant(merchantId: string) {
  const q = query(
    collection(db!, COLLECTIONS.ORDERS),
    where('merchantId', '==', merchantId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string) {
  // This would need to be a Cloud Function for production
  // For now, we'll use direct update
  const { doc, updateDoc } = require('firebase/firestore');
  const orderRef = doc(db!, COLLECTIONS.ORDERS, orderId);
  await updateDoc(orderRef, { status, updatedAt: new Date() });
}
