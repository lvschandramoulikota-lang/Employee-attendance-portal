import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (photoBase64: string) => void;
  capturedPhoto?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  capturedPhoto,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(capturedPhoto || null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStreaming(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. Please grant browser camera permissions.');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    if (!photo) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror image horizontally for front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhoto(dataUrl);
      onCapture(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    onCapture('');
    startCamera();
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl p-4 text-white shadow-inner border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-emerald-400" />
          Punch Verification Selfie
        </span>
        {photo && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Captured
          </span>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {photo ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
          <img
            src={photo}
            alt="Captured verification selfie"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={retakePhoto}
            className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border border-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
          </button>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
          {cameraError ? (
            <div className="p-4 text-center max-w-xs">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-md transition"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={!isStreaming}
                className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition flex items-center gap-2 border border-emerald-400/30"
              >
                <Camera className="w-4 h-4" /> Snap Verification Selfie
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
