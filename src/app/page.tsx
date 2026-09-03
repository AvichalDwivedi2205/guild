import {
  ArrowRight,
  Bot,
  Braces,
  Check,
  CircleStop,
  Cloud,
  GitBranch,
  History,
  MousePointer2,
  RotateCcw,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';

const roles = [
  { name: 'Product Lead', engine: 'Codex CLI', initials: 'PL', color: '#2fa36b' },
  { name: 'Product Designer', engine: 'Claude Code', initials: 'PD', color: '#e4823c' },
  { name: 'System Architect', engine: 'Claude Code', initials: 'SA', color: '#8b5cf0' },
  { name: 'AI Systems Engineer', engine: 'Codex CLI', initials: 'AI', color: '#d24d93' },
  { name: 'Backend Engineer', engine: 'Codex CLI', initials: 'BE', color: '#4e86c8' },
  { name: 'Security Engineer', engine: 'Claude Code', initials: 'SE', color: '#de4b4b' },
  { name: 'Implementation Lead', engine: 'Codex CLI', initials: 'IL', color: '#8c8378' },
] as const;

function GuildMark() {
  return <span className="guild-prism" aria-hidden="true" />;
}

export default function HomePage() {
  return (
    <main className="guild-landing">
      <div className="ambient-bloom" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <nav className="guild-nav glass-surface" aria-label="Main navigation">
        <Link className="guild-brand" href="/" aria-label="Guild home">
          <GuildMark /> Guild
        </Link>
        <div className="guild-nav-links">
          <a href="#canvas-modes">Canvas</a>
          <a href="#ai-team">AI team</a>
          <a href="#local-runner">Runner</a>
        </div>
        <div className="guild-nav-actions">
          <ThemeToggle compact />
          <Link className="guild-button guild-button-quiet" href="/sign-in">
            Sign in
          </Link>
          <Link className="guild-button guild-button-primary" href="/sign-up">
            Start building <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <section className="guild-hero">
        <div className="guild-grid" aria-hidden="true" />
        <div className="guild-wrap guild-hero-copy">
          <div className="guild-kicker">
            <span /> Multiplayer canvas for humans and local AI Workers
          </div>
          <h1>Build with an AI team, not an AI chat.</h1>
          <p>
            Keep requirements, flows, wireframes, architecture, tasks, decisions, and execution on
            one shared infinite canvas. See every teammate work—and reverse every change.
          </p>
          <form className="guild-composer glass-surface" action="/sign-up">
            <Sparkles size={17} aria-hidden="true" />
            <input
              name="project"
              aria-label="Describe what you are building"
              placeholder="An AI support inbox for Shopify sellers…"
            />
            <button className="guild-button guild-button-primary" type="submit">
              Create workspace
            </button>
          </form>
          <div className="guild-role-chips" aria-label="Recommended Worker roles">
            <span>Recommended</span>
            {roles.slice(0, 6).map((role) => (
              <span className="guild-chip" key={role.name}>
                <i style={{ background: role.color }} /> {role.name.replace(' Engineer', '')}
              </span>
            ))}
          </div>
          <p className="guild-local-note">
            No model API keys. Your local client logins stay local.
          </p>
        </div>

        <div className="hero-workspace" aria-hidden="true">
          <svg viewBox="0 0 800 580" fill="none">
            <path d="M142 126 C214 126 210 80 278 80" />
            <path d="M148 288 C214 288 210 164 278 164" />
            <path d="M446 92 C502 92 492 174 552 174" />
            <path d="M435 178 C514 178 500 345 574 345" />
            <path d="M282 402 C392 402 408 342 574 342" strokeDasharray="6 6" />
          </svg>
          <article className="hero-node hero-sticky hero-sticky-amber">
            <small>PROBLEM · P0</small>
            <strong>Merchants drown in repeat questions</strong>
          </article>
          <article className="hero-node hero-sticky hero-sticky-mint">
            <small>REQUIREMENT · P0</small>
            <strong>Answers cite the real order</strong>
          </article>
          <article className="hero-node hero-card hero-requirement">
            <small>REQUIREMENT</small>
            <strong>Draft replies from order history</strong>
          </article>
          <article className="hero-node hero-card hero-wireframe">
            <div className="wireframe-chrome">
              <i />
              <i />
              <i />
            </div>
            <strong>Ticket #4821</strong>
            <span />
            <span />
            <button tabIndex={-1}>Send reply</button>
          </article>
          <article className="hero-node hero-card hero-database">
            <Cloud size={20} />
            <span>
              <strong>tickets</strong>
              <small>Convex · live data</small>
            </span>
          </article>
          <article className="hero-node hero-card hero-task">
            <span className="task-check">
              <Check size={11} />
            </span>
            <strong>Draft-reply endpoint</strong>
            <small>backend · P0</small>
          </article>
          <article className="hero-node hero-card hero-review">
            <ShieldCheck size={15} />
            <span>Use opaque public ticket IDs.</span>
          </article>
          <div className="hero-cursor hero-cursor-human">
            <MousePointer2 size={19} fill="currentColor" />
            <span>Avichal</span>
          </div>
          <div className="hero-cursor hero-cursor-worker">
            <MousePointer2 size={19} fill="currentColor" />
            <span>Product Designer · Claude Code</span>
          </div>
        </div>

        <div className="guild-wrap guild-proof-row">
          <span>
            <i style={{ background: '#2fa36b' }} /> Live human collaboration
          </span>
          <span>
            <i style={{ background: '#8b5cf0' }} /> Attributed, reversible Worker changes
          </span>
          <span>
            <i style={{ background: '#d24d93' }} /> No model API keys in Guild Cloud
          </span>
        </div>
      </section>

      <section className="guild-band guild-wrap" id="canvas-modes">
        <div className="guild-section-heading">
          <div>
            <span>ONE WORKSPACE · ONE CANVAS</span>
            <h2>Three ways to make things.</h2>
          </div>
          <p>
            Modes change the tools in your hand, not the project underneath. Everything stays
            connected through typed relationships and shared history.
          </p>
        </div>
        <div className="mode-showcase">
          <article className="glass-surface mode-card mode-diagram">
            <header>
              <Workflow size={18} />
              <span>Diagram</span>
              <small>PRODUCT + SYSTEMS</small>
            </header>
            <div className="mode-preview mode-preview-diagram">
              <span className="preview-sticky" />
              <span className="preview-node" />
              <span className="preview-node preview-round" />
              <svg viewBox="0 0 360 170">
                <path d="M92 62 H148 M216 62 C260 62 246 116 292 116" />
              </svg>
            </div>
            <p>Requirements, journeys, decisions, system architecture, and AI architecture.</p>
          </article>
          <article className="glass-surface mode-card mode-tasks">
            <header>
              <GitBranch size={18} />
              <span>Task</span>
              <small>PLAN + SHIP</small>
            </header>
            <div className="mode-preview task-columns">
              <div>
                <small>BACKLOG</small>
                <span />
                <span />
              </div>
              <div>
                <small>IN PROGRESS</small>
                <span />
                <span />
              </div>
              <div>
                <small>REVIEW</small>
                <span />
              </div>
            </div>
            <p>Implementation plans, dependencies, bugs, reviews, testing, and launch work.</p>
          </article>
          <article className="glass-surface mode-card mode-wireframe">
            <header>
              <Braces size={18} />
              <span>Wireframe</span>
              <small>SCREEN + FLOW</small>
            </header>
            <div className="mode-preview wireframe-preview">
              <div>
                <i />
                <i />
                <i />
                <span />
                <span />
                <button tabIndex={-1}>Continue</button>
              </div>
              <div className="phone">
                <i />
                <span />
                <span />
              </div>
            </div>
            <p>Low-fidelity screens and states linked directly back to requirements.</p>
          </article>
        </div>
      </section>

      <section className="guild-band team-band" id="ai-team">
        <div className="guild-wrap">
          <div className="guild-section-heading">
            <div>
              <span>ROLE PROFILES</span>
              <h2>Give every Worker a clear job.</h2>
            </div>
            <p>
              Workers own bounded sections, use Codex CLI or Claude Code through your local Runner,
              and leave visible progress, comments, and Change Sets.
            </p>
          </div>
          <div className="role-rail" tabIndex={0} aria-label="Worker role profiles">
            {roles.map((role) => (
              <article className="glass-surface role-card" key={role.name}>
                <div className="role-card-head">
                  <span style={{ background: role.color }}>{role.initials}</span>
                  <div>
                    <strong>{role.name}</strong>
                    <small>{role.engine}</small>
                  </div>
                </div>
                <p>
                  Owns a project area, receives an explicit brief, and works only inside its
                  reserved region.
                </p>
                <span className="guild-chip">
                  <i style={{ background: role.color }} /> Ready for Runner
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="guild-band guild-wrap" id="local-runner">
        <div className="runner-story glass-surface">
          <div>
            <span className="guild-kicker">
              <i /> LOCAL EXECUTION BOUNDARY
            </span>
            <h2>Your clients stay on your machine.</h2>
            <p>
              Guild Runner launches the official Codex CLI and Claude Code clients you already use.
              Cloud coordinates jobs and durable canvas state; it never receives your provider
              credentials.
            </p>
            <div className="runner-actions">
              <Link className="guild-button guild-button-primary" href="/sign-up">
                Create a workspace
              </Link>
              <Link className="guild-button guild-button-quiet" href="/runner/pair">
                Pair Runner
              </Link>
            </div>
          </div>
          <div className="runner-diagram">
            <div>
              <Cloud size={21} />
              <strong>Guild Cloud</strong>
              <small>Canvas · Jobs · Change Sets</small>
            </div>
            <ArrowRight size={18} />
            <div>
              <Server size={21} />
              <strong>Guild Runner</strong>
              <small>Claims · leases · local MCP</small>
            </div>
            <ArrowRight size={18} />
            <div>
              <Bot size={21} />
              <strong>Codex / Claude</strong>
              <small>Signed-in local clients</small>
            </div>
          </div>
        </div>
      </section>

      <section className="guild-band guild-wrap">
        <div className="reversible-grid">
          <article className="glass-surface">
            <CircleStop size={21} />
            <h3>Stop the run</h3>
            <p>Cancel active work and revoke outstanding authority.</p>
          </article>
          <article className="glass-surface">
            <RotateCcw size={21} />
            <h3>Undo Worker changes</h3>
            <p>Reverse a Team Run without erasing concurrent human edits.</p>
          </article>
          <article className="glass-surface">
            <History size={21} />
            <h3>Keep the decision trail</h3>
            <p>Every durable action stays attributed and inspectable.</p>
          </article>
        </div>
      </section>

      <footer className="guild-footer guild-wrap">
        <div>
          <Link className="guild-brand" href="/">
            <GuildMark /> Guild
          </Link>
          <p>One shared workspace where humans and local AI Workers build software together.</p>
        </div>
        <div>
          <span>Product</span>
          <a href="#canvas-modes">Canvas modes</a>
          <a href="#ai-team">AI team</a>
          <a href="#local-runner">Runner</a>
        </div>
        <div>
          <span>Get started</span>
          <Link href="/sign-up">Create account</Link>
          <Link href="/sign-in">Access your account</Link>
        </div>
      </footer>
    </main>
  );
}
