import { ArrowRight, Command, MousePointer2, Users } from 'lucide-react';
import Link from 'next/link';

const collaborators = [
  { initials: 'PL', name: 'Product Lead', engine: 'Codex', color: '#bbf7d0' },
  { initials: 'PD', name: 'Product Designer', engine: 'Claude Code', color: '#fed7aa' },
  { initials: 'SA', name: 'System Architect', engine: 'Codex', color: '#bfdbfe' },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Guild home">
          <span className="brand-mark">G</span>
          <span>Guild</span>
        </Link>
        <div className="nav-actions">
          <Link className="button button-ghost" href="/sign-in">
            Sign in
          </Link>
          <Link className="button button-dark" href="/sign-up">
            Start building <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> Multiplayer workspace for humans + AI Workers
          </p>
          <h1>Build with an AI team, not an AI chat.</h1>
          <p className="hero-lede">
            Shape product, flows, architecture, and implementation on one shared canvas while
            trusted local Codex and Claude Code Workers build beside you.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/sign-up">
              Open your workspace <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <p>No model API keys. Your local client logins stay local.</p>
          </div>
        </div>

        <div className="canvas-preview" aria-label="Guild canvas preview">
          <div className="preview-topbar">
            <div className="window-dots">
              <span />
              <span />
              <span />
            </div>
            <span>Checkout redesign</span>
            <div className="preview-avatars">
              {collaborators.map((collaborator) => (
                <span key={collaborator.initials} style={{ background: collaborator.color }}>
                  {collaborator.initials}
                </span>
              ))}
            </div>
          </div>
          <div className="preview-board">
            <div className="preview-toolbar">
              <button aria-label="Select">
                <MousePointer2 size={16} />
              </button>
              <button aria-label="Command">
                <Command size={16} />
              </button>
              <button aria-label="Team">
                <Users size={16} />
              </button>
            </div>
            <div className="preview-section section-product">
              <span className="section-label">PRODUCT</span>
              <div className="sticky sticky-green">One-click checkout</div>
              <div className="sticky sticky-yellow">Guest payment path</div>
            </div>
            <div className="preview-section section-design">
              <span className="section-label">DESIGN</span>
              <div className="wireframe-card">
                <div className="wireframe-bar" />
                <div className="wireframe-line short" />
                <div className="wireframe-line" />
                <div className="wireframe-button" />
              </div>
            </div>
            <div className="preview-section section-architecture">
              <span className="section-label">ARCHITECTURE</span>
              <div className="arch-node">Web app</div>
              <span className="arrow-line">→</span>
              <div className="arch-node">API</div>
              <span className="arrow-line">→</span>
              <div className="arch-node">Payments</div>
            </div>
            <div className="worker-cursor cursor-designer">
              <MousePointer2 size={18} fill="currentColor" />
              <span>Product Designer · Claude Code</span>
            </div>
            <div className="worker-cursor cursor-architect">
              <MousePointer2 size={18} fill="currentColor" />
              <span>System Architect · Codex</span>
            </div>
          </div>
        </div>
      </section>

      <section className="principles" aria-label="Guild principles">
        <article>
          <span>01</span>
          <h2>One canvas</h2>
          <p>Ideas, flows, wireframes, architecture, and tasks share one visual project context.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Real teammates</h2>
          <p>Humans and local Workers create visible, attributed, reversible work together.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Local execution</h2>
          <p>
            Guild Runner launches your signed-in official clients. Guild Cloud performs no
            inference.
          </p>
        </article>
      </section>
    </main>
  );
}
