import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle private key - replace \n with actual newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function seedData() {
  console.log('🌱 Seeding data...\n');

  // Create a test merchant
  const merchantId = 'test_merchant_1';
  const merchantData = {
    userId: 'test_merchant_1',
    shopName: '港式奶茶舖',
    description: '正宗港式奶茶',
    address: '香港中環荷李活道123號',
    phone: '+852 1234 5678',
    categories: ['食品', '飲品'],
    commissionRate: 0.10,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection('merchants').doc(merchantId).set(merchantData);
  console.log('✅ Created merchant: 港式奶茶舖');

  // Create products
  const products = [
    {
      merchantId,
      merchantName: '港式奶茶舖',
      name: '港式奶茶',
      description: '正宗港式奶茶，茶味濃郁',
      price: 28,
      category: '飲品',
      status: 'active',
    },
    {
      merchantId,
      merchantName: '港式奶茶舖',
      name: '港式檸檬茶',
      description: '新鮮檸檬製作',
      price: 25,
      category: '飲品',
      status: 'active',
    },
    {
      merchantId,
      merchantName: '港式奶茶舖',
      name: '港式咖啡',
      description: '即磨咖啡',
      price: 22,
      category: '飲品',
      status: 'active',
    },
    {
      merchantId,
      merchantName: '港式奶茶舖',
      name: '奶油多士',
      description: '香脆多士配牛油',
      price: 18,
      category: '食品',
      status: 'active',
    },
    {
      merchantId,
      merchantName: '港式奶茶舖',
      name: '蛋治',
      description: '火腿蛋三文治',
      price: 25,
      category: '食品',
      status: 'active',
    },
  ];

  for (const product of products) {
    const docRef = db.collection('products').doc();
    await docRef.set({
      ...product,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`✅ Created product: ${product.name}`);
  }

  // Create second merchant
  const merchant2Id = 'test_merchant_2';
  const merchant2Data = {
    userId: 'test_merchant_2',
    shopName: '泰式美食',
    description: '正宗泰國菜',
    address: '香港九龍旺角彌敦道456號',
    phone: '+852 9876 5432',
    categories: ['食品'],
    commissionRate: 0.10,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection('merchants').doc(merchant2Id).set(merchant2Data);
  console.log('✅ Created merchant: 泰式美食');

  const products2 = [
    {
      merchantId: merchant2Id,
      merchantName: '泰式美食',
      name: '泰式咖喱飯',
      description: '濃郁咖喱配白飯',
      price: 48,
      category: '食品',
      status: 'active',
    },
    {
      merchantId: merchant2Id,
      merchantName: '泰式美食',
      name: '泰式炒河',
      description: '傳統泰式炒河',
      price: 42,
      category: '食品',
      status: 'active',
    },
    {
      merchantId: merchant2Id,
      merchantName: '泰式美食',
      name: '冬蔭功湯',
      description: '酸辣海鮮湯',
      price: 38,
      category: '食品',
      status: 'active',
    },
  ];

  for (const product of products2) {
    const docRef = db.collection('products').doc();
    await docRef.set({
      ...product,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`✅ Created product: ${product.name}`);
  }

  // Create a test driver
  const driverId = 'test_driver_1';
  const driverData = {
    userId: 'test_driver_1',
    name: '陳大文',
    phone: '+852 5555 1234',
    vehicleType: '電單車',
    licensePlate: 'AB 1234',
    status: 'active',
    rating: 4.8,
    totalDeliveries: 156,
    walletBalance: 2340,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection('drivers').doc(driverId).set(driverData);
  console.log('✅ Created driver: 陳大文');

  console.log('\n🎉 Seed completed!');
  console.log(`📊 Total: 2 merchants, ${products.length + products2.length} products, 1 driver`);
}

seedData().catch(console.error);
