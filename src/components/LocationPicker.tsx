'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Search, Navigation, Check } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string | null;
}

const GOOGLE_MAPS_KEY = 'AIzaSyDS57j4SARWQi-_NaKjKliV1znBa41Hm-s';

export default function LocationPicker({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialLat, 
  initialLng,
  initialAddress 
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress || '');
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || 22.3193);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || 114.1694);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
      } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      }
    }
  }, [isOpen]);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: selectedLat, lng: selectedLng },
        zoom: 15,
        streetViewControl: false,
        mapTypeControl: false,
      });
      googleMapRef.current = map;

      // Click to set marker
      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setSelectedLat(lat);
        setSelectedLng(lng);
        updateMarker(lat, lng);
        
        // Reverse geocode
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: e.latLng }, (results: any) => {
          if (results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      });

      // Add initial marker
      updateMarker(selectedLat, selectedLng);
    }
  }, [mapLoaded]);

  const updateMarker = (lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        animation: window.google.maps.Animation.DROP,
      });
    }
  };

  // Search address using OpenStreetMap Nominatim (free, no API key needed)
  const handleSearch = async () => {
    if (!searchQuery) return;
    
    try {
      // Use OpenStreetMap Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery + ', Hong Kong')}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setSelectedLat(lat);
        setSelectedLng(lng);
        setAddress(result.display_name);
        
        // Center map if loaded
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat, lng });
          googleMapRef.current.setZoom(16);
        }
        
        // Update marker
        if (window.google && markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        } else if (window.google && googleMapRef.current) {
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: googleMapRef.current,
            animation: window.google.maps.Animation.DROP,
          });
        }
      } else {
        alert('搵唔到呢個地址，請試其他關鍵詞');
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('搜尋失敗，請試多次');
    }
  };

  const handleConfirm = () => {
    onSelect(selectedLat, selectedLng, address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-purple-600 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Navigation className="w-5 h-5" /> 店舖位置設定
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-purple-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Section */}
        <div className="p-4 border-b bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📍 輸入店舖地址搜尋 (OpenStreetMap)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="例如: 銅鑼灣時代廣場..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              搜尋
            </button>
          </div>
        </div>

        {/* Map Section */}
        <div className="h-80 relative">
          <div ref={mapRef} className="w-full h-full bg-gray-100" />
          
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-500">載入地圖中...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="px-4 py-2 bg-blue-50 text-sm text-blue-700">
          💡 Click地圖 anywhere可以設置精準位置，或用上方搜尋功能
        </div>

        {/* Selected Location Display */}
        <div className="p-4 border-t">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-5 h-5 text-purple-600 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">已選擇位置：</p>
              <p className="font-medium">{address || '未設定地址'}</p>
              <p className="text-sm text-purple-600 font-mono">
                座標: {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-3 border rounded-xl hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            確認儲存
          </button>
        </div>
      </div>
    </div>
  );
}