import { useEffect, useRef, useState } from "react";
import { Monitor, MonitorStop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  onFrame: (base64Frame: string) => void;
  onActiveChange: (active: boolean) => void;
  disabled?: boolean;
}

export function ScreenShare({ onFrame, onActiveChange, disabled }: Props) {
  const [active, setActive] = useState(false);
  const mediaRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRef.current) {
      mediaRef.current.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
    onActiveChange(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Scale down for performance
    const maxW = 1280;
    const scale = Math.min(1, maxW / canvas.width);
    canvas.width = Math.round(canvas.width * scale);
    canvas.height = Math.round(canvas.height * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    onFrame(dataUrl);
  };

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore - displaySurface is not in all TS types but supported in browsers
          displaySurface: "monitor",
        },
        audio: false,
      });

      // User cancelled or ended via browser UI
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopCapture();
        toast.info("Screen sharing ended");
      });

      mediaRef.current = stream;

      // Create hidden video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.play();
      videoRef.current = video;

      // Hidden canvas for frame capture
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      setActive(true);
      onActiveChange(true);
      toast.success("Screen sharing started");

      // Capture first frame after a brief delay to let video initialize
      setTimeout(() => captureFrame(), 500);

      // Then every 7 seconds
      intervalRef.current = window.setInterval(captureFrame, 7000);
    } catch (err: any) {
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        console.error("Screen share error:", err);
        toast.error("Failed to start screen sharing");
      }
    }
  };

  return (
    <>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        className={`h-9 w-9 shrink-0 ${active ? "text-danger glow-cyan" : "text-muted-foreground"} hover:text-primary`}
        onClick={active ? stopCapture : startCapture}
        title={active ? "Stop sharing screen" : "Share screen"}
      >
        {active ? <MonitorStop className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
      </Button>

      {/* Active indicator */}
      {active && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-danger/90 text-white text-xs uppercase tracking-wider shadow-lg animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Screen sharing active
        </div>
      )}
    </>
  );
}
