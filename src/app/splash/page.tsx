"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SPLASH_DURATION = 5000; // ms

export default function SplashPage() {
  const navigate = useNavigate();
  const [fading, setFading] = useState(false);
  const [remaining, setRemaining] = useState(Math.ceil(SPLASH_DURATION / 1000));

  useEffect(() => {
    // Lock scrolling while splash is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fadeTimeout = setTimeout(() => {
      setFading(true);
    }, SPLASH_DURATION - 700);

    const redirectTimeout = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, SPLASH_DURATION);

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(fadeTimeout);
      clearTimeout(redirectTimeout);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <>
      {/* Full-screen splash wrapper — blocks all interaction */}
      <div
        role="status"
        aria-live="polite"
        aria-label={`Splash screen. Redirecting to dashboard in ${remaining} seconds.`}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          pointerEvents: "all",
          userSelect: "none",
          transition: "opacity 0.7s ease-out",
          opacity: fading ? 0 : 1,
          overflow: "hidden",
        }}
      >
        {/* Background: splash.png covers the full viewport */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/splash.png')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* CSS fallback layer — visible if splash.png is absent or loading */}
        <div className="splash-bg-fallback" />

        {/* Bottom overlay: progress bar + redirect counter */}
        <div
          style={{
            position: "absolute",
            bottom: "clamp(24px, 5vh, 56px)",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.6rem",
            animation: "splashFadeIn 1.2s ease-out 0.8s both",
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              width: "min(300px, 72vw)",
              height: "3px",
              background: "rgba(120, 200, 255, 0.18)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background:
                  "linear-gradient(90deg, #22d3ee, #818cf8, #f0abfc)",
                borderRadius: "2px",
                animation: `splashProgress ${SPLASH_DURATION}ms linear forwards`,
                boxShadow: "0 0 8px rgba(34, 211, 238, 0.6)",
              }}
            />
          </div>

          <p
            style={{
              color: "rgba(180, 220, 255, 0.75)",
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              fontFamily: "inherit",
            }}
          >
            Redirecting in {remaining}s…
          </p>
        </div>
      </div>

      <style>{`
        /* ── Fallback CSS background (image5 aesthetic) ── */
        .splash-bg-fallback {
          position: absolute;
          inset: 0;
          /* Deep blue starry night base */
          background:
            radial-gradient(ellipse 60% 55% at 50% 40%, rgba(12, 24, 80, 0.0) 0%, rgba(4, 8, 40, 0.85) 100%),
            radial-gradient(ellipse 80% 60% at 50% 100%, rgba(20, 60, 160, 0.55) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 20% 60%, rgba(0, 180, 200, 0.22) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 60%, rgba(160, 40, 220, 0.20) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 50% 50%, rgba(0, 100, 255, 0.15) 0%, transparent 70%),
            linear-gradient(180deg, #020818 0%, #060d2e 40%, #0a1250 75%, #050a28 100%);
          /* Star particles via box-shadow on pseudo-elements */
          overflow: hidden;
          z-index: 0;
        }
        .splash-bg-fallback::before {
          content: "";
          position: absolute;
          inset: 0;
          /* Aurora streaks */
          background:
            radial-gradient(ellipse 90% 18% at 50% 28%, rgba(0, 220, 230, 0.28) 0%, transparent 100%),
            radial-gradient(ellipse 70% 12% at 30% 40%, rgba(120, 60, 255, 0.22) 0%, transparent 100%),
            radial-gradient(ellipse 80% 15% at 65% 35%, rgba(240, 80, 220, 0.18) 0%, transparent 100%),
            radial-gradient(ellipse 60% 20% at 50% 20%, rgba(40, 180, 255, 0.30) 0%, transparent 100%);
          animation: auroraShift 8s ease-in-out infinite alternate;
          z-index: 1;
        }
        .splash-bg-fallback::after {
          content: "";
          position: absolute;
          inset: 0;
          /* Glowing sci-fi platform ring */
          background:
            radial-gradient(ellipse 30% 8% at 50% 72%, rgba(0, 220, 255, 0.45) 0%, transparent 100%),
            radial-gradient(ellipse 18% 18% at 50% 68%, rgba(40, 160, 255, 0.30) 0%, transparent 100%),
            radial-gradient(ellipse 6% 25% at 50% 55%, rgba(160, 220, 255, 0.55) 0%, transparent 100%);
          /* Energy beam + platform */
          animation: beamPulse 3s ease-in-out infinite alternate;
          z-index: 2;
        }

        @keyframes auroraShift {
          from { opacity: 0.8; transform: scaleX(1) translateY(0); }
          to   { opacity: 1;   transform: scaleX(1.06) translateY(-6px); }
        }
        @keyframes beamPulse {
          from { opacity: 0.75; }
          to   { opacity: 1; }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </>
  );
}
