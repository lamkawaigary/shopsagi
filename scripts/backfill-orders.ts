import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type OrderItem = {
  merchantId?: string;
  merchantName?: string;
};

type OrderDoc = {
  userId?: string;
  customerId?: string;
  merchantId?: string | null;
  merchantIds?: string[];
  itemsMerchantIds?: string[];
  merchantName?: string;
  orderNumber?: string;
  items?: OrderItem[];
  createdAt?: { toDate?: () => Date } | Date | string;
};

type Patch = Partial<OrderDoc>;

function uniqueNonEmpty(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function datePartForOrderNumber(value?: OrderDoc['createdAt']) {
  if (!value) return '';
  if (value instanceof Date) return value.getTime().toString().slice(-8);
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.getTime().toString().slice(-8);
  }
  if (typeof value === 'object' && 'toDate' in value) {
    const date = value.toDate?.();
    return date ? date.getTime().toString().slice(-8) : '';
  }
  return '';
}

function buildPatch(docId: string, data: OrderDoc): Patch {
  const patch: Patch = {};
  const itemMerchantIds = uniqueNonEmpty((data.items || []).map((item) => item?.merchantId));
  const itemMerchantNames = uniqueNonEmpty((data.items || []).map((item) => item?.merchantName));

  const merchantIds = uniqueNonEmpty([
    data.merchantId || undefined,
    ...(Array.isArray(data.merchantIds) ? data.merchantIds : []),
    ...itemMerchantIds,
    ...(Array.isArray(data.itemsMerchantIds) ? data.itemsMerchantIds : []),
  ]);

  if (!data.customerId && data.userId) {
    patch.customerId = data.userId;
  }

  const currentMerchantIds = uniqueNonEmpty(data.merchantIds || []);
  const currentItemsMerchantIds = uniqueNonEmpty(data.itemsMerchantIds || []);
  if (
    merchantIds.length > 0 &&
    (merchantIds.length !== currentMerchantIds.length ||
      merchantIds.some((id) => !currentMerchantIds.includes(id)))
  ) {
    patch.merchantIds = merchantIds;
  }

  if (
    merchantIds.length > 0 &&
    (merchantIds.length !== currentItemsMerchantIds.length ||
      merchantIds.some((id) => !currentItemsMerchantIds.includes(id)))
  ) {
    patch.itemsMerchantIds = merchantIds;
  }

  const singleMerchantId = merchantIds.length === 1 ? merchantIds[0] : null;
  if (data.merchantId !== singleMerchantId) {
    patch.merchantId = singleMerchantId;
  }

  if (!data.merchantName && itemMerchantNames.length > 0) {
    patch.merchantName = itemMerchantNames.length === 1 ? itemMerchantNames[0] : itemMerchantNames.join(' / ');
  }

  if (!data.orderNumber) {
    const suffix = datePartForOrderNumber(data.createdAt) || docId.slice(-8);
    patch.orderNumber = `SG${suffix}`;
  }

  return patch;
}

function hasPatch(patch: Patch) {
  return Object.keys(patch).length > 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  const db = getFirestore();
  const ordersRef = db.collection('orders');
  const snapshot = await ordersRef.get();
  const docs = typeof limit === 'number' ? snapshot.docs.slice(0, Math.max(limit, 0)) : snapshot.docs;

  console.log(`[backfill-orders] mode=${dryRun ? 'dry-run' : 'write'} total_scanned=${docs.length}`);

  let patchedCount = 0;
  let unchangedCount = 0;

  for (const docSnap of docs) {
    const data = docSnap.data() as OrderDoc;
    const patch = buildPatch(docSnap.id, data);

    if (!hasPatch(patch)) {
      unchangedCount += 1;
      continue;
    }

    patchedCount += 1;
    console.log(`[patch] order=${docSnap.id} fields=${Object.keys(patch).join(',')}`);

    if (!dryRun) {
      await ordersRef.doc(docSnap.id).set(patch, { merge: true });
    }
  }

  console.log(
    `[backfill-orders] done scanned=${docs.length} patched=${patchedCount} unchanged=${unchangedCount} mode=${
      dryRun ? 'dry-run' : 'write'
    }`
  );
}

main().catch((error) => {
  console.error('[backfill-orders] failed:', error);
  process.exit(1);
});
