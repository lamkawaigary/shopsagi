'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Upload, Check, X, FileText, CreditCard, MapPin } from 'lucide-react';

interface KYCData {
  status: 'pending' | 'approved' | 'rejected';
  businessName?: string;
  businessRegistrationNo?: string;
  idCardFront?: string;
  idCardBack?: string;
  addressProof?: string;
  submittedAt?: any;
  reviewedAt?: any;
  rejectionReason?: string;
}

export default function MerchantKYCUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  
  const [businessName, setBusinessName] = useState('');
  const [businessRegNo, setBusinessRegNo] = useState('');
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [addressProof, setAddressProof] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const kycDoc = await getDoc(doc(db!, 'kyc_merchants', currentUser.uid));
        if (kycDoc.exists()) {
          setKycData(kycDoc.data() as KYCData);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!storage) throw new Error("Storage not initialized");
    const storageRef = ref(storage, `${path}/${user!.uid}_${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !storage) return;

    setSubmitting(true);
    try {
      const kycData: KYCData = {
        status: 'pending',
        businessName,
        businessRegistrationNo: businessRegNo,
        submittedAt: serverTimestamp(),
      };

      // Upload files
      if (idCardFront) {
        kycData.idCardFront = await uploadFile(idCardFront, 'kyc/merchant/id');
      }
      if (idCardBack) {
        kycData.idCardBack = await uploadFile(idCardBack, 'kyc/merchant/id');
      }
      if (addressProof) {
        kycData.addressProof = await uploadFile(addressProof, 'kyc/merchant/address');
      }

      await setDoc(doc(db, 'kyc_merchants', user.uid), kycData);
      setKycData(kycData);
      alert('提交成功！等待審批。');
    } catch (error) {
      console.error('KYC submit error:', error);
      alert('提交失敗，請重試');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Already submitted
  if (kycData?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">商戶認證</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-semibold mb-2">認證審批中</h3>
          <p className="text-gray-600">我哋正在審批你既認證資料，通常1-3個工作天完成。</p>
        </div>
      </div>
    );
  }

  if (kycData?.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">商戶認證</h2>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
            <X className="w-5 h-5" /> 認證被拒絕
          </div>
          <p className="text-gray-700">{kycData.rejectionReason || '請重新提交認證資料'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">商戶認證 (KYC)</h2>
      <p className="text-gray-600 mb-6">提交以下資料完成認證，審批後即可開始營業。</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> 商戶資料
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商戶名稱 *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商業登記號碼
              </label>
              <input
                type="text"
                value={businessRegNo}
                onChange={(e) => setBusinessRegNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="可選填"
              />
            </div>
          </div>
        </div>

        {/* ID Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> 身份證明文件
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身份證正面 *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdCardFront(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身份證背面
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdCardBack(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Address Proof */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> 地址證明
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              住址/商業地址證明
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setAddressProof(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">例如：水電煤單、银行月結單</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '提交緊...' : '提交認證'}
        </button>
      </form>
    </div>
  );
}
