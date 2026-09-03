# Guild × Cinemaverse demo flow

The authoritative timed flow, narration, agent briefs, recording gates, capture responsibilities,
editing plan, and fallback behavior are defined in `DEMO_VIDEO_SCRIPT.md`.

This file previously described a deleted movie-discovery concept with Home, Watchlist,
Recommendations, and AI Discovery screens. That is no longer the product being demonstrated.

The current demo builds and opens **Cinemaverse**: a screenplay-to-location research product with
parallel source-grounded research and a domain-specific infinite canvas.

The final story is:

```text
Guild landing page
    → one Cinemaverse team instruction
    → Claude Sonnet + Codex workstreams
    → detailed connected artifacts
    → hosted screen designs
    → point/region annotations reviewed and sent once per owning agent
    → revised design + implementation evidence
    → working Cinemaverse research canvas
    → Guild closes as the reviewable, reversible control plane
```

Target delivery runtime is approximately 3 minutes 15 seconds. Record a normal-speed master first.
The video may selectively accelerate slow UI movement to 1.1×–1.2×, but face camera and narration
remain at natural speed.

The separate Cinemaverse repository now contains the working six-screen vertical slice, interactive
research canvas, detailed Markdown reading, desktop/mobile browser coverage, and immutable hosted
Versions 1 and 2. Guild now has a dedicated Annotate tool for both canvas artifacts and embedded
hosted screens, plus a grouped `Review & send` step with an optional unanchored overall instruction.
Recording remains gated on creating the clean dedicated Cinemaverse workspace baseline, rehearsing
the grouped architecture/design feedback loop, and passing the final clean-capture preflight.
