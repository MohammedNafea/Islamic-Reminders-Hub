import { useState, useEffect, useRef } from "react";
import { Compass, Camera, CameraOff } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QiblaCompassProps {
  lat: number;
  lng: number;
}

export function QiblaCompass({ lat, lng }: QiblaCompassProps) {
  const { t } = useTranslation();
  const [qibla, setQibla] = useState(0);
  const [heading, setHeading] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Calculate Qibla angle (Makkah is at 21.4225, 39.8262)
    const mLat = 21.4225 * (Math.PI / 180);
    const mLng = 39.8262 * (Math.PI / 180);
    const uLat = lat * (Math.PI / 180);
    const uLng = lng * (Math.PI / 180);

    const y = Math.sin(mLng - uLng);
    const x = Math.cos(uLat) * Math.tan(mLat) - Math.sin(uLat) * Math.cos(mLng - uLng);
    const q = Math.atan2(y, x) * (180 / Math.PI);
    setQibla(q);

    // Get device orientation if available
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHeading(e.alpha);
      }
    };

    window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener);
    return () => window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener);
  }, [lat, lng]);

  const toggleCamera = async () => {
    if (cameraActive) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4 p-6 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden transition-all duration-500",
      cameraActive ? "bg-black min-h-[400px]" : "bg-card/60 backdrop-blur-sm"
    )}>
      {cameraActive && (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}

      <div className={cn("text-center relative z-10", cameraActive && "text-white")}>
        <h3 className={cn("font-heading font-bold text-lg", cameraActive ? "text-white" : "text-primary")}>{t("prayer.qibla.direction")}</h3>
        <p className="text-xs opacity-70 uppercase tracking-widest font-bold">{Math.round(qibla)}° {t("prayer.qibla.from_north")}</p>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center z-10">
        {/* Outer Ring */}
        <div className={cn("absolute inset-0 border-4 rounded-full", cameraActive ? "border-white/20" : "border-primary/10")} />
        
        {/* Compass Ring */}
        <motion.div 
          className={cn("absolute inset-0 border-t-4 rounded-full", cameraActive ? "border-white" : "border-primary")}
          animate={{ rotate: -heading }}
          transition={{ type: "spring", stiffness: 50 }}
        />

        {/* Qibla Needle */}
        <motion.div 
          className="relative flex flex-col items-center"
          animate={{ rotate: qibla - heading }}
          transition={{ type: "spring", stiffness: 30 }}
        >
          <div className={cn("w-1.5 h-20 rounded-full shadow-lg", cameraActive ? "bg-white" : "bg-primary")} />
          <div className={cn("w-3 h-3 rounded-full absolute top-0 -translate-y-1/2", cameraActive ? "bg-white" : "bg-primary")} />
          <Compass className={cn("w-8 h-8 absolute -bottom-10", cameraActive ? "text-white" : "text-primary")} />
        </motion.div>

        {/* Directions */}
        <div className="absolute top-2 font-black text-[10px] opacity-40">N</div>
        <div className="absolute bottom-2 font-black text-[10px] opacity-40">S</div>
        <div className="absolute left-2 font-black text-[10px] opacity-40">W</div>
        <div className="absolute right-2 font-black text-[10px] opacity-40">E</div>
      </div>
      
      <div className="flex flex-col items-center gap-4 relative z-10 w-full">
        <Button 
          variant={cameraActive ? "secondary" : "outline"} 
          className="rounded-full gap-2 w-full max-w-[200px]"
          onClick={toggleCamera}
        >
          {cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          {cameraActive ? t("prayer.qibla.camera_disable") : t("prayer.qibla.camera_enable")}
        </Button>

        <p className={cn("text-[10px] max-w-[200px] text-center leading-tight opacity-60", cameraActive ? "text-white" : "text-muted-foreground")}>
          {t("prayer.qibla_hint")}
        </p>
      </div>
    </div>
  );
}
