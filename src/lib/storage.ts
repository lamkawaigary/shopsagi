import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadProductImage(file: File, merchantId: string): Promise<string> {
  if (!storage) throw new Error('Storage not initialized');
  
  // Create a unique filename
  const timestamp = Date.now();
  const filename = `${merchantId}_${timestamp}_${file.name}`;
  const storageRef = ref(storage, `products/${filename}`);
  
  // Upload the file
  const snapshot = await uploadBytes(storageRef, file);
  
  // Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}

export function getProductImageUrl(merchantId: string, filename: string): string {
  if (!storage) return '';
  return `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/products%2F${filename}?alt=media`;
}
