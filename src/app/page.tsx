"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createDecartClient, models, type RealTimeClient } from "@decartai/sdk";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const realtimeClientRef = useRef<RealTimeClient | null>(null);

  // Request camera permission on mount
  useEffect(() => {
    async function initCamera() {
      try {
        const model = models.realtime("lucy-latest");
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            frameRate: model.fps,
            width: model.width,
            height: model.height,
          },
        });

        streamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setCameraReady(true);
      } catch (err) {
        console.error("Camera error:", err);
        setError("Failed to access camera. Please grant camera permissions.");
      }
    }

    initCamera();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect();
      }
    };
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const startTransformation = useCallback(async () => {
    if (!cameraReady || !streamRef.current) {
      setError("Camera not ready. Please allow camera access.");
      return;
    }

    if (!referenceImage) {
      setError("Please upload a reference image first");
      return;
    }

    // Use local API key if provided, otherwise try environment variable
    const key = apiKey || process.env.NEXT_PUBLIC_DECART_API_KEY || "";
    if (!key) {
      setError("Please add your Decart API Key first (click 'Add API Key' button)");
      setShowApiKeyInput(true);
      return;
    }

    setConnectionState("connecting");
    setError("Connecting to AI service...");

    try {
      const client = createDecartClient({
        apiKey: key,
      });

      const model = models.realtime("lucy-latest");

      const realtimeClient = await client.realtime.connect(streamRef.current, {
        model,
        mirror: false,
        onRemoteStream: (remoteStream) => {
          console.log("Remote stream received, tracks:", remoteStream.getVideoTracks().length);
          if (outputVideoRef.current) {
            outputVideoRef.current.srcObject = remoteStream;
            // Ensure video plays
            outputVideoRef.current.play().catch(e => {
              console.log("Play error:", e);
            });
          }
        },
        onConnectionChange: (state) => {
          console.log("Connection state:", state);
          if (state === "connected" || state === "generating") {
            setIsConnected(true);
            setConnectionState("connected");
            setError(null);
          } else if (state === "reconnecting") {
            setIsConnected(false);
            setConnectionState("connecting");
            setError("Reconnecting...");
          } else {
            setIsConnected(false);
            setConnectionState("idle");
          }
        },
        onError: (err) => {
          console.error("Realtime error:", err);
          setError("AI Error: " + (err?.message || err?.error || "Connection failed"));
          setConnectionState("error");
        },
        initialState: {
          prompt: {
            text: "Substitute the character in the video with the person in the reference image.",
            enhance: true,
          },
          image: referenceImage,
        },
      });

      realtimeClientRef.current = realtimeClient;
      setIsConnected(true);
      setConnectionState("connected");
      setError(null);
    } catch (err: any) {
      console.error("Failed to start:", err);
      let errorMessage = "Failed to connect to AI service";
      if (err?.message?.includes("Insufficient credits")) {
        errorMessage = "Insufficient credits! Please add credits to your Decart account.";
      } else if (err?.error?.includes("Insufficient credits")) {
        errorMessage = "Insufficient credits! Please add credits to your Decart account.";
      } else if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
        errorMessage = "Invalid API key. Please check your Decart API key.";
      }
      setError(errorMessage);
      setConnectionState("error");
    }
  }, [cameraReady, referenceImage, apiKey]);

  const stopTransformation = useCallback(() => {
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    setIsConnected(false);
    setConnectionState("idle");
    
    // Clear the output video
    if (outputVideoRef.current) {
      outputVideoRef.current.srcObject = null;
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#0a0a0f]">
      {/* Logo */}
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-blue-400 tracking-wider" style={{ textShadow: '0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4)' }}>
        JagaSwap
      </h1>

      {/* Upload Reference Image */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer"
          style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px dashed rgba(59, 130, 246, 0.5)',
            color: '#93c5fd'
          }}
        >
          {referenceImage ? "Change Reference Image" : "Upload Reference Image"}
        </button>
        {referenceImage && (
          <div className="w-32 h-32 rounded-lg overflow-hidden" style={{ border: '2px solid rgba(59, 130, 246, 0.5)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}>
            <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* API Key Input */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <button
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="px-4 py-1 text-sm rounded-lg transition-all duration-300 cursor-pointer"
          style={{ 
            background: apiKey ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.1)', 
            border: apiKey ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(139, 92, 246, 0.5)',
            color: apiKey ? '#4ade80' : '#c4b5fd'
          }}
        >
          {apiKey ? "✓ API Key Ready" : (showApiKeyInput ? "Hide API Key" : "Add API Key")}
        </button>
        {showApiKeyInput && (
          <div className="flex flex-col items-center gap-2">
            <input
              type="text"
              placeholder="Paste Decart API Key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="px-4 py-3 rounded-lg w-80 text-sm"
              style={{ 
                background: 'rgba(10, 10, 15, 0.9)', 
                border: '2px solid rgba(139, 92, 246, 0.6)',
                color: '#e0e0e0'
              }}
            />
            <p className="text-xs text-blue-300/50">
              {apiKey ? "API Key entered! Now click START" : "Paste your Decart API key here, then click START"}
            </p>
          </div>
        )}
      </div>

      {/* Video Windows */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 w-full max-w-4xl">
        {/* Left: Live Camera */}
        <div className="flex-1">
          <div 
            className="aspect-video rounded-2xl overflow-hidden relative"
            style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-blue-400">Initializing camera...</span>
              </div>
            )}
          </div>
          <p className="text-center mt-2 text-blue-300/70 text-sm">Live Camera</p>
        </div>

        {/* Right: AI Output */}
        <div className="flex-1">
          <div 
            className="aspect-video rounded-2xl overflow-hidden relative"
            style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
            }}
          >
            <video
              ref={outputVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isConnected && connectionState === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-blue-400/70 text-sm">AI Output</span>
              </div>
            )}
            {connectionState === "connecting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <span className="text-blue-400 text-sm mb-2">AI Processing...</span>
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {isConnected && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded bg-green-500/80 text-white text-xs font-medium">
                LIVE
              </div>
            )}
          </div>
          <p className="text-center mt-2 text-blue-300/70 text-sm">AI Transformed</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Start/Stop Buttons */}
      <div className="flex gap-4">
        {!isConnected ? (
          <button
            onClick={startTransformation}
            disabled={!cameraReady || !referenceImage || connectionState === "connecting"}
            className="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: (!apiKey && !process.env.NEXT_PUBLIC_DECART_API_KEY) ? 'rgba(239, 68, 68, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)'}
          >
            {connectionState === "connecting" ? "Connecting..." : "Start"}
          </button>
        ) : (
          <button 
            onClick={stopTransformation} 
            className="px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            style={{ 
              background: 'rgba(59, 130, 246, 0.1)',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              color: '#60a5fa'
            }}
          >
            Stop
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-6 flex items-center gap-2 text-sm text-blue-300/50">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isConnected ? '#4ade80' : connectionState === "connecting" ? '#facc15' : '#6b7280',
            animation: (isConnected || connectionState === "connecting") ? 'pulse 2s ease-in-out infinite' : 'none'
          }}
        />
        <span>
          {isConnected
            ? "Connected"
            : connectionState === "connecting"
            ? "Connecting to AI..."
            : "Ready"}
        </span>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}