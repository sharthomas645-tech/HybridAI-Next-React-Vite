"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AuroraBackground from "@/components/AuroraBackground";

const SPLASH_DURATION = 5000; // ms

export default function SplashPage() {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const [remaining, setRemaining] = useState(Math.ceil(SPLASH_DURATION / 1000));

  useEffect(() => {
    const fadeTimeout = setTimeout(() => {
      setFading(true);
    }, SPLASH_DURATION - 600);

    const redirectTimeout = setTimeout(() => {
      router.replace("/dashboard");
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
      clearTimeout(fadeTimeout);
      clearTimeout(redirectTimeout);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <>
      <AuroraBackground />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50,
          transition: "opacity 0.6s ease-out",
          opacity: fading ? 0 : 1,
        }}
      >
        {/* Logo / splash image */}
        <div
          style={{
            marginBottom: "2rem",
            animation: "splashFadeIn 0.8s ease-out forwards",
          }}
        >
          <Image
            src="/hybridai.png"
            alt="HybridAI MedLegal"
            width={320}
            height={320}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* Brand text */}
        <h1
          className="gradient-text-inline"
          style={{
            fontSize: "clamp(1.8rem, 5vw, 3rem)",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textAlign: "center",
            marginBottom: "0.5rem",
            animation: "splashFadeIn 1s ease-out 0.2s both",
          }}
        >
          HybridAI MedLegal
        </h1>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "1.05rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "3rem",
            animation: "splashFadeIn 1s ease-out 0.4s both",
          }}
        >
          Medical Chronology Intelligence
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: "min(320px, 80vw)",
            height: "3px",
            background: "rgba(100, 160, 255, 0.15)",
            borderRadius: "2px",
            overflow: "hidden",
            animation: "splashFadeIn 1s ease-out 0.5s both",
          }}
        >
          <div
            style={{
              height: "100%",
              background:
                "linear-gradient(90deg, var(--blue-2), var(--purple-2), var(--aqua-2))",
              borderRadius: "2px",
              animation: `splashProgress ${SPLASH_DURATION}ms linear forwards`,
            }}
          />
        </div>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            marginTop: "1rem",
            animation: "splashFadeIn 1s ease-out 0.6s both",
          }}
        >
          Redirecting in {remaining}s…
        </p>
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(12px); }
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
