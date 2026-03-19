'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop();
          },
          () => {}
        );
      } catch (err: any) {
        setError(err.message || '無法開啟相機');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <h3 className="font-bold">掃描條碼/二維碼</h3>
        <button onClick={onClose} className="text-2xl p-2">✕</button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-red-500 text-center">
            <p>{error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-white rounded">關閉</button>
          </div>
        ) : (
          <div id="qr-reader" className="w-full max-w-sm"></div>
        )}
      </div>

      <div className="bg-gray-800 text-white p-4 text-center">
        <p className="text-sm text-gray-400">將條碼對準鏡頭</p>
      </div>
    </div>
  );
}
