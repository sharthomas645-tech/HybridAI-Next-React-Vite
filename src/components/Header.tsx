import { ReactNode } from "react";
import "./HybridHero.css";

interface HybridHeroProps {
  children?: ReactNode;
  user?: { username: string; email: string };
}

export default function HybridHero({ children, user: _user }: HybridHeroProps) {
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

          {/* Wordmark + subtitle */}
          <div className="hh-text">
            <h1 className="hh-title" aria-label="HybridAI">
              {/* H Logo SVG */}
              <svg className="hh-logo" width="70" height="70" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="hLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                    <stop offset="100%" stopColor="rgba(0,200,255,0.25)" />
                  </linearGradient>
                  <linearGradient id="hLogoStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#7ff0ff" />
                  </linearGradient>
                </defs>
                {/* Hexagonal background */}
                <polygon points="50,8 88,30 88,70 50,92 12,70 12,30" fill="url(#hLogoBg)" stroke="url(#hLogoStroke)" strokeWidth="1.5" />
                {/* H letter */}
                <g transform="translate(50,50)">
                  <path d="M -15,-15 L -15,15 M 15,-15 L 15,15 M -15,0 L 15,0" stroke="url(#hLogoStroke)" strokeWidth="6" strokeLinecap="round" fill="none" />
                </g>
              </svg>

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
