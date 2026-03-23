import { ReactNode } from "react";
import "./HybridHero.css";

interface HybridHeroProps {
  children?: ReactNode;
}

export default function HybridHero({ children }: HybridHeroProps) {
  return (
    <section className="hh-root" aria-label="HybridAI hero banner">
      {/* Deep-blue gradient background is applied via CSS on hh-root */}

      {/* Starfield layer */}
      <div className="hh-starfield" aria-hidden="true" />

      {/* Aurora / light-streak layers */}
      <div className="hh-aurora hh-aurora-1" aria-hidden="true" />
      <div className="hh-aurora hh-aurora-2" aria-hidden="true" />
      <div className="hh-aurora hh-aurora-3" aria-hidden="true" />

      {/* Ambient center glow */}
      <div className="hh-glow-center" aria-hidden="true" />

      {/* Hero branding content */}
      <div className="hh-content">
        <div className="hh-brand">

          {/* H hexagon logo mark */}
          <svg
            className="hh-logo"
            viewBox="0 0 60 55"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hh-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#7ff0ff" />
                <stop offset="100%" stopColor="#00b4e8" />
              </linearGradient>
            </defs>
            <polygon
              points="58,27.5 44,52 16,52 2,27.5 16,3 44,3"
              fill="none"
              stroke="url(#hh-logo-grad)"
              strokeWidth="3"
            />
            <text
              x="30"
              y="37"
              textAnchor="middle"
              fill="url(#hh-logo-grad)"
              fontSize="26"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              H
            </text>
          </svg>

          {/* Wordmark + subtitle */}
          <div className="hh-text">
            <h1 className="hh-title" aria-label="HybridAI">
              <span className="hh-hybrid">Hybrid</span>
              <span className="hh-ai-wrap">
                <sup className="hh-tm">™</sup>
                <span className="hh-ai">AI</span>
              </span>
            </h1>
            <p className="hh-sub1">Medical Chronology &amp; Analyzer</p>
            <p className="hh-sub2">Intelligence System</p>
            <div className="hh-divider" aria-hidden="true" />
          </div>

        </div>
      </div>

      {/* Slot for centered overlay content (e.g. login card) */}
      {children && (
        <div className="hh-slot">
          {children}
        </div>
      )}
    </section>
  );
}
