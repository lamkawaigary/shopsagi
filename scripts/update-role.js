const { initializeApp, cert } = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./service-account-key.json');

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

async function updateUserRole(email, newRole) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid} (${email})`);
    
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.update({ role: newRole });
    console.log(`✅ Updated role to: ${newRole}`);
    
    if (newRole === 'driver') {
      const driverRef = db.collection('drivers').doc(userRecord.uid);
      await driverRef.set({
        userId: userRecord.uid,
        email: email,
        status: 'online',
        vehicleType: 'motorcycle',
        rating: 5.0,
        todayEarnings: 0,
        todayCompleted: 0,
        weekEarnings: 0,
        totalEarnings: 0,
        createdAt: new Date()
      }, { merge: true });
      console.log('✅ Created driver document');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateUserRole('garylkw1842@gmail.com', 'driver');
