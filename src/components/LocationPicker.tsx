'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';

// Google Maps will be loaded dynamically
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  apiKey?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDS57j4SARWQi-_NaKjKliV1znBa41Hm-s';

export default function LocationPicker({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialLat, 
  initialLng 
}: LocationPickerProps) {
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || 22.3193);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || 114.1694);
  const [address, setAddress] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    if (isOpen && !(window as any).google) {
      // First check if Google Maps already loaded
      if (typeof window !== 'undefined' && (window as any).google) {
        setMapLoaded(true);
        return;
      }
      
      // Load the Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setMapLoaded(false);
      };
      document.head.appendChild(script);
    }
  }, [isOpen]);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isOpen && (window as any).google && mapRef.current && !googleMapRef.current) {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: selectedLat, lng: selectedLng },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
      });
      
      googleMapRef.current = map;
      
      // Add click listener
      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setSelectedLat(lat);
        setSelectedLng(lng);
        
        // Update marker
        if (markerRef.current) {
          markerRef.current.setPosition(e.latLng);
        } else {
          markerRef.current = new (window as any).google.maps.Marker({
            position: e.latLng,
            map: map,
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#9333ea',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
        }
        
        // Reverse geocode to get address
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: e.latLng }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      });
    }
  }, [isOpen]);

  // Update map center when initial coords change
  useEffect(() => {
    if (googleMapRef.current && initialLat && initialLng) {
      googleMapRef.current.setCenter({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  if (!isOpen) return null;

  // Show fallback if no Google Maps API key
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">需要 Google Maps API Key</h3>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <p className="text-gray-600 mb-4">
            請先係 Vercel 度設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </p>
          <button onClick={onClose} className="w-full py-3 bg-purple-600 text-white rounded-xl">
            明白
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Navigation className="w-5 h-5" /> 選擇位置
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Map */}
        <div ref={mapRef} className="w-full h-72 bg-gray-100" />

        {/* Selected Info */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">已選擇：</span>
            <span className="font-mono text-purple-600">
              {selectedLat?.toFixed(5)}, {selectedLng?.toFixed(5)}
            </span>
          </div>
          
          {address && (
            <p className="text-sm text-gray-600 mb-2">{address}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={() => {
              onSelect(selectedLat, selectedLng, address);
              onClose();
            }}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            確認位置
          </button>
        </div>
      </div>
    </div>
  );
}