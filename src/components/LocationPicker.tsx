'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

const HK_BOUNDS = {
  north: 22.56,
  south: 22.28,
  east: 114.41,
  west: 114.08
};

export default function LocationPicker({ isOpen, onClose, onSelect, initialLat, initialLng }: LocationPickerProps) {
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat || 22.3193);
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLng || 114.1694);
  const [address, setAddress] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw a simple map on canvas
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Background (Hong Kong waters)
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Simple land mass approximation
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.4, canvas.height * 0.5, canvas.width * 0.3, canvas.height * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x = (canvas.width / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      const y = (canvas.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Hong Kong Island label area
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.fillText('Hong Kong Island', canvas.width * 0.3, canvas.height * 0.5);
    ctx.fillText('Kowloon', canvas.width * 0.65, canvas.height * 0.45);
    ctx.fillText('NT', canvas.width * 0.5, canvas.height * 0.7);
    
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(drawMap, 100);
    }
  }, [isOpen, drawMap]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert pixel to lat/lng
    const lat = HK_BOUNDS.south + ((HK_BOUNDS.north - HK_BOUNDS.south) * (1 - y / canvas.height));
    const lng = HK_BOUNDS.west + ((HK_BOUNDS.east - HK_BOUNDS.west) * (x / canvas.width));
    
    setSelectedLat(Number(lat.toFixed(4)));
    setSelectedLng(Number(lng.toFixed(4)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Navigation className="w-5 h-5" /> 選擇送貨位置
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Map Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-64 cursor-crosshair bg-gray-100"
          />
          
          {/* Selected marker */}
          {selectedLat && selectedLng && (
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((selectedLng - HK_BOUNDS.west) / (HK_BOUNDS.east - HK_BOUNDS.west)) * 100}%`,
                top: `${((HK_BOUNDS.north - selectedLat) / (HK_BOUNDS.north - HK_BOUNDS.south)) * 100}%`
              }}
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <MapPin className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 p-3 text-sm text-purple-700">
          💡 Click on the map above to mark delivery location
        </div>

        {/* Selected Coordinates Display */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">已選擇位置：</span>
            {selectedLat && selectedLng && (
              <span className="font-mono text-purple-600">
                {selectedLat}, {selectedLng}
              </span>
            )}
          </div>
          
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="輸入地址備註 (可選)"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-3 border rounded-xl hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (selectedLat && selectedLng) {
                onSelect(selectedLat, selectedLng, address);
                onClose();
              }
            }}
            disabled={!selectedLat || !selectedLng}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            確認位置
          </button>
        </div>
      </div>
    </div>
  );
}