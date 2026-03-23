import "./HybridHero.css";

const HybridHero = ({ children }) => {
    return (
        <section className="hh-root">
            <div className="hh-bg" aria-hidden="true" />
            <div className="hh-stars hh-stars--sm" aria-hidden="true" />
            <div className="hh-stars hh-stars--md" aria-hidden="true" />
            <div className="hh-stars hh-stars--lg" aria-hidden="true" />
            <div className="hh-atmos hh-atmos--tl" aria-hidden="true" />
            <div className="hh-atmos hh-atmos--br" aria-hidden="true" />
            <div className="hh-atmos hh-atmos--center" aria-hidden="true" />
            <div className="hh-atmos hh-atmos--focal" aria-hidden="true" />
            <div className="hh-aurora hh-aurora--1" aria-hidden="true" />
            <div className="hh-aurora hh-aurora--2" aria-hidden="true" />
            <div className="hh-aurora hh-aurora--3" aria-hidden="true" />
            <div className="hh-aurora hh-aurora--4" aria-hidden="true" />
            <div className="hh-aurora hh-aurora--5" aria-hidden="true" />
            <div className="hh-aurora hh-aurora--6" aria-hidden="true" />
            <div className="hh-aurora hh-aurora--7" aria-hidden="true" />
            <div className="hh-trail hh-trail--1" aria-hidden="true" />
            <div className="hh-trail hh-trail--2" aria-hidden="true" />
            <div className="hh-trail hh-trail--3" aria-hidden="true" />
            <div className="hh-trail hh-trail--4" aria-hidden="true" />
            <div className="hh-trail hh-trail--5" aria-hidden="true" />
            <div className="hh-bloom hh-bloom--1" aria-hidden="true" />
            <div className="hh-bloom hh-bloom--2" aria-hidden="true" />
            <div className="hh-bloom hh-bloom--3" aria-hidden="true" />
            <div className="hh-fog hh-fog--1" aria-hidden="true" />
            <div className="hh-fog hh-fog--2" aria-hidden="true" />
            <div className="hh-vignette" aria-hidden="true" />
            <div className="hh-content">
                <div className="hh-brand-row">
                    <div className="hh-logo" aria-label="HybridAI logo">
                        <svg className="hh-logo-svg" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" >
                            <defs>
                                <linearGradient id="hhGMain" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                                    <stop offset="20%" stopColor="#e0f4ff" stopOpacity="1" />
                                    <stop offset="48%" stopColor="#4dd6f5" stopOpacity="1" />
                                    <stop offset="75%" stopColor="#0ea5e9" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0.92" />
                                </linearGradient>
                                <linearGradient id="hhGHl" x1="0%" y1="0%" x2="18%" y2="100%">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                                    <stop offset="55%" stopColor="#ffffff" stopOpacity="0.22" />
                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="hhGCross" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
                                    <stop offset="20%" stopColor="#7dd3fc" stopOpacity="0.85" />
                                    <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                                    <stop offset="80%" stopColor="#7dd3fc" stopOpacity="0.85" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.55" />
                                </linearGradient>
                                <filter id="hhFInner">
                                    <feGaussianBlur stdDeviation="2.5" result="b" />
                                    <feMerge>
                                        <feMergeNode in="b" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <filter id="hhFOuter" x="-80%" y="-80%" width="260%" height="260%">
                                    <feGaussianBlur stdDeviation="7" result="b" />
                                    <feMerge>
                                        <feMergeNode in="b" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <filter id="hhFHalo" x="-150%" y="-150%" width="400%" height="400%">
                                    <feGaussianBlur stdDeviation="14" />
                                </filter>
                            </defs>
                            <path d="M14 10 L14 90 L26 90 L26 56 L54 56 L54 90 L66 90 L66 10 L54 10 L54 44 L26 44 L26 10 Z" fill="#22d3ee" opacity="0.38" filter="url(#hhFHalo)" />
                            <path d="M14 10 L14 90 L26 90 L26 56 L54 56 L54 90 L66 90 L66 10 L54 10 L54 44 L26 44 L26 10 Z" fill="url(#hhGMain)" opacity="0.5" filter="url(#hhFOuter)" />
                            <path d="M14 10 L14 90 L26 90 L26 56 L54 56 L54 90 L66 90 L66 10 L54 10 L54 44 L26 44 L26 10 Z" fill="url(#hhGMain)" filter="url(#hhFInner)" />
                            <path d="M15 10 L15 42 L21 40 L21 12 L26 10 Z" fill="url(#hhGHl)" />
                            <path d="M54 10 L54 12 L62 12 L62 28 L66 26 L66 10 Z" fill="url(#hhGHl)" opacity="0.62" />
                            <rect x="26" y="45" width="28" height="10" fill="url(#hhGCross)" />
                            <rect x="27" y="47" width="26" height="5" fill="white" opacity="0.72" />
                            <line x1="26" y1="10" x2="26" y2="44" stroke="rgba(120,230,255,0.55)" strokeWidth="0.8" />
                            <line x1="54" y1="10" x2="54" y2="44" stroke="rgba(120,230,255,0.55)" strokeWidth="0.8" />
                            <line x1="26" y1="56" x2="26" y2="90" stroke="rgba(120,230,255,0.35)" strokeWidth="0.8" />
                            <line x1="54" y1="56" x2="54" y2="90" stroke="rgba(120,230,255,0.35)" strokeWidth="0.8" />
                        </svg>
                    </div>
                    <div className="hh-wordmark">
                        <h1 className="hh-title">
                            <span className="hh-hybrid">Hybrid</span><span className="hh-ai">AI</span><sup className="hh-tm">™</sup>
                        </h1>
                    </div>
                </div>
                <div className="hh-divider" aria-hidden="true" />
                <p className="hh-subtitle">
                    <span className="hh-sub-line">Medical Chronology &amp; Analyzer</span>
                    <span className="hh-sub-line">Intelligence System</span>
                </p>
                {children && <div className="hh-slot">{children}</div>}
            </div>
        </section>
    );
};

export default HybridHero;