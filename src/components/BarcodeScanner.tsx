'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
import { getProductByBarcode, normalizeProduct, type NormalizedFood } from '@/lib/openfoodfacts';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onProductFound: (product: NormalizedFood) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manualBarcode, setManualBarcode] = useState<string>('');

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      const html5QrCode = new Html5Qrcode('barcode-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        async (decodedText) => {
          if (isProcessing) return;
          
          setIsProcessing(true);
          await handleBarcodeDetected(decodedText);
        },
        undefined
      );
    } catch (err) {
      console.error('Scanner başlatma hatası:', err);
      setError('Kamera erişimi reddedildi veya desteklenmiyor. Manuel barkod girişi kullanın.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Scanner durdurma hatası:', err);
      }
    }
    setIsScanning(false);
    setIsProcessing(false);
  };

  const handleBarcodeDetected = async (barcode: string) => {
    // 🔧 FIX: Ensure scanner is always stopped, even on error
    let scannerStopped = false;
    
    try {
      setError('');
      
      // Stop scanner first
      await stopScanner();
      scannerStopped = true;

      // Fetch product from OpenFoodFacts
      const product = await getProductByBarcode(barcode);
      
      if (product) {
        const normalized = normalizeProduct(product);
        onProductFound(normalized);
        onClose();
      } else {
        setError(`Barkod bulunamadı: ${barcode}. Farklı bir ürün deneyin veya manuel giriş yapın.`);
      }
    } catch (err) {
      console.error('Barkod işleme hatası:', err);
      setError('Ürün bilgisi alınırken hata oluştu.');
      
      // 🔧 FIX: Ensure scanner is stopped even if error occurs
      if (!scannerStopped) {
        try {
          await stopScanner();
        } catch (stopErr) {
          console.error('Scanner durdurma hatası:', stopErr);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualBarcode.trim()) return;
    
    setIsProcessing(true);
    await handleBarcodeDetected(manualBarcode.trim());
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Barkod Tara</DialogTitle>
          <DialogDescription>
            Ürünün barkodunu tarayın veya manuel olarak girin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Scanner */}
          <div className="relative">
            <div 
              id="barcode-reader" 
              className={`w-full rounded-lg overflow-hidden ${isScanning ? 'block' : 'hidden'}`}
            />
            
            {!isScanning && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  Barkodu taramak için kamerayı başlatın
                </p>
                <Button onClick={startScanner} disabled={isProcessing}>
                  <Camera className="h-4 w-4 mr-2" />
                  Kamerayı Başlat
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="mt-2 flex justify-center">
                <Button onClick={stopScanner} variant="destructive" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Taramayı Durdur
                </Button>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Ürün bilgisi alınıyor...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Manual Barcode Input */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Manuel Barkod Girişi:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="8690504000000"
                className="flex-1 px-3 py-2 border rounded-md"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
              <Button 
                onClick={handleManualSearch} 
                disabled={!manualBarcode.trim() || isProcessing}
              >
                Ara
              </Button>
            </div>
          </div>

          <Button onClick={onClose} variant="outline" className="w-full">
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
