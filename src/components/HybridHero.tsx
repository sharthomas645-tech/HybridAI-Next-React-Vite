import "./HybridHero.css";

export default function HybridHero() {
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
    </section>
  );
}
