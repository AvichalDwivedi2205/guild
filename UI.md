<!--
  VISUAL REFERENCE ONLY.
  Use this file for Guild's visual language, density, composition, and interaction inspiration.
  PRODUCT.md, Plan.md, CONTEXT.md, and Initial_Prompt.md remain authoritative for behavior,
  terminology, architecture, security, and scope. Do not copy prototype-only fake data or motion.
-->
<!DOCTYPE html>
<html lang="en" data-theme="dark" data-view="landing">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Guild — Build with an AI team, not an AI chat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@10..48,75..100,300..800&family=Inter+Tight:ital,wght@0,300..700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
/* ============================================================
   GUILD — design tokens
   ============================================================ */
:root{
  --f-display:'Bricolage Grotesque','Inter Tight',system-ui,sans-serif;
  --f-ui:'Inter Tight',system-ui,-apple-system,'Segoe UI',sans-serif;
  --f-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;

  /* agent identity hues — functional, identical across themes */
  --h-product:#2FA36B;
  --h-design:#E4823C;
  --h-arch:#8B5CF0;
  --h-ai:#D24D93;
  --h-impl:#8C8378;
  --h-sec:#DE4B4B;
  --h-human-1:#E0AE18;
  --h-human-2:#6E9B2F;

  --r-panel:22px;
  --r-node:13px;
  --r-btn:11px;
  --r-chip:999px;
  --r-sticky:4px;
  --r-frame:10px;

  --sp:8px;
  --ease:cubic-bezier(.22,.86,.3,1);
}

html[data-theme="light"]{
  --substrate:#F4F3F1;
  --ink:#1A1917;
  --ink-2:#57534E;
  --ink-3:#8A847C;
  --ink-4:#B5AFA7;

  --bloom-a:rgba(196,186,172,.30);
  --bloom-b:rgba(178,192,178,.22);
  --bloom-c:rgba(206,188,190,.20);
  --bloom-d:rgba(206,196,168,.18);

  --glass:rgba(255,255,255,.72);
  --glass-strong:rgba(255,255,255,.88);
  --glass-quiet:rgba(255,255,255,.52);
  --sheen-a:rgba(255,255,255,.42);
  --sheen-b:rgba(255,255,255,0);
  --edge-hi:rgba(255,255,255,.95);
  --edge-mid:rgba(255,255,255,.30);
  --edge-tint:rgba(26,25,23,.10);
  --hairline:rgba(26,25,23,.11);
  --hairline-soft:rgba(26,25,23,.06);

  --lift-1:0 1px 1px rgba(26,25,23,.04), 0 6px 16px -10px rgba(26,25,23,.20);
  --lift-2:0 1px 2px rgba(26,25,23,.05), 0 18px 44px -20px rgba(26,25,23,.26);
  --lift-node:0 1px 1px rgba(26,25,23,.04), 0 5px 14px -10px rgba(26,25,23,.22);

  --paper:#FBFAF9;
  --paper-2:#FFFFFF;
  --grid:rgba(26,25,23,.14);
  --wire:rgba(26,25,23,.28);
  --wire-soft:rgba(26,25,23,.13);

  --btn:#1F1D1A;
  --btn-ink:#FFFFFF;
  --btn-quiet:rgba(255,255,255,.70);

  --node-fill:rgba(255,255,255,.88);
  --node-fill-2:rgba(255,255,255,.72);
  --shade:rgba(26,25,23,.045);
  --scrim:rgba(244,243,241,.76);
}

html[data-theme="dark"]{
  --substrate:#100F0E;
  --ink:#F2F0EC;
  --ink-2:#B2ACA4;
  --ink-3:#847E76;
  --ink-4:#5B564F;

  --bloom-a:rgba(120,106,86,.24);
  --bloom-b:rgba(96,108,94,.20);
  --bloom-c:rgba(118,94,98,.18);
  --bloom-d:rgba(116,104,74,.16);

  --glass:rgba(255,250,242,.055);
  --glass-strong:rgba(255,250,242,.095);
  --glass-quiet:rgba(255,250,242,.03);
  --sheen-a:rgba(255,255,255,.07);
  --sheen-b:rgba(255,255,255,0);
  --edge-hi:rgba(255,255,255,.20);
  --edge-mid:rgba(255,255,255,.06);
  --edge-tint:rgba(255,255,255,.04);
  --hairline:rgba(255,250,242,.10);
  --hairline-soft:rgba(255,250,242,.055);

  --lift-1:0 1px 2px rgba(0,0,0,.35), 0 8px 20px -12px rgba(0,0,0,.6);
  --lift-2:0 2px 4px rgba(0,0,0,.4), 0 22px 52px -22px rgba(0,0,0,.75);
  --lift-node:0 1px 2px rgba(0,0,0,.3), 0 7px 18px -12px rgba(0,0,0,.55);

  --paper:#151413;
  --paper-2:#1C1B19;
  --grid:rgba(255,250,242,.09);
  --wire:rgba(232,226,216,.36);
  --wire-soft:rgba(232,226,216,.15);

  --btn:#F2F0EC;
  --btn-ink:#14130F;
  --btn-quiet:rgba(255,250,242,.09);

  --node-fill:rgba(38,36,33,.86);
  --node-fill-2:rgba(30,29,26,.74);
  --shade:rgba(255,250,242,.045);
  --scrim:rgba(16,15,14,.76);
}

/* ============================================================
   base
   ============================================================ */
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family:var(--f-ui);
  font-size:15px;
  line-height:1.55;
  color:var(--ink);
  background:var(--substrate);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  overflow-x:hidden;
}
img{max-width:100%;display:block}
button,input,textarea,select{font:inherit;color:inherit}
button{background:none;border:0;cursor:pointer;padding:0}
a{color:inherit;text-decoration:none}
h1,h2,h3,h4,p,figure,ul,ol{margin:0}
ul,ol{padding:0;list-style:none}
:focus-visible{outline:2px solid var(--ink-2);outline-offset:3px;border-radius:6px}
::selection{background:color-mix(in srgb,var(--h-human-1) 30%,transparent)}

/* substrate: colour lives behind the glass, never on it */
#substrate{position:fixed;inset:0;z-index:0;overflow:hidden;background:var(--substrate);transition:background .5s var(--ease)}
#substrate b{position:absolute;display:block;border-radius:50%;filter:blur(110px);opacity:.7;transition:transform 1.2s var(--ease)}
.b1{width:56vw;height:56vw;left:-14vw;top:-18vw;background:radial-gradient(circle at 50% 50%,var(--bloom-a),transparent 68%)}
.b2{width:48vw;height:48vw;right:-10vw;top:4vh;background:radial-gradient(circle at 50% 50%,var(--bloom-b),transparent 68%)}
.b3{width:40vw;height:40vw;left:26vw;bottom:-24vw;background:radial-gradient(circle at 50% 50%,var(--bloom-c),transparent 66%)}
.b4{width:26vw;height:26vw;right:20vw;bottom:-10vw;background:radial-gradient(circle at 50% 50%,var(--bloom-d),transparent 66%)}

/* ============================================================
   the glass recipe
   ============================================================ */
.glass{
  position:relative;
  background-image:linear-gradient(177deg,var(--sheen-a),var(--sheen-b) 42%);
  background-color:var(--glass);
  backdrop-filter:blur(20px) saturate(125%);
  -webkit-backdrop-filter:blur(20px) saturate(125%);
  box-shadow:var(--lift-1);
  border-radius:var(--r-panel);
}
.glass::before{
  content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
  background:linear-gradient(150deg,var(--edge-hi),var(--edge-mid) 38%,var(--edge-tint) 62%,var(--edge-mid) 80%,var(--edge-hi));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;
}
.glass-2{background-color:var(--glass-strong);box-shadow:var(--lift-2)}
.glass-q{background-color:var(--glass-quiet);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%)}

/* ============================================================
   type scale
   ============================================================ */
.display{
  font-family:var(--f-display);
  font-weight:600;
  letter-spacing:-.035em;
  line-height:.96;
  font-variation-settings:'wdth' 92;
}
.h-xl{font-size:clamp(32px,4vw,56px)}
.h-l{font-size:clamp(26px,3.1vw,42px)}
.h-m{font-size:clamp(21px,2.2vw,28px)}
.lede{font-size:clamp(16px,1.35vw,19px);line-height:1.5;color:var(--ink-2);max-width:46ch}
.small{font-size:13px;line-height:1.5;color:var(--ink-2)}
.tiny{font-size:11.5px;line-height:1.45;color:var(--ink-3)}
.mono{font-family:var(--f-mono);font-size:12px;letter-spacing:-.01em}
.num{font-variant-numeric:tabular-nums}

/* ============================================================
   controls
   ============================================================ */
.btn{
  display:inline-flex;align-items:center;gap:8px;
  height:42px;padding:0 20px;border-radius:var(--r-btn);
  font-weight:500;font-size:14.5px;letter-spacing:-.01em;
  transition:transform .18s var(--ease),box-shadow .18s var(--ease),background-color .18s var(--ease);
  white-space:nowrap;
}
.btn:active{transform:translateY(1px) scale(.99)}
.btn-primary{background:var(--btn);color:var(--btn-ink);box-shadow:var(--lift-1)}
.btn-primary:hover{box-shadow:var(--lift-2)}
.btn-glass{background:var(--btn-quiet);color:var(--ink);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);box-shadow:inset 0 0 0 1px var(--hairline)}
.btn-glass:hover{background:var(--glass-strong)}
.btn-sm{height:34px;padding:0 14px;font-size:13.5px;border-radius:9px}
.btn-icon{width:34px;height:34px;padding:0;justify-content:center;border-radius:9px}

.chip{
  display:inline-flex;align-items:center;gap:7px;height:29px;padding:0 12px;
  border-radius:var(--r-chip);font-size:12.5px;font-weight:500;color:var(--ink-2);
  background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft);
}
.dot{width:7px;height:7px;border-radius:50%;flex:none}

.seg{display:inline-flex;padding:3px;gap:2px;border-radius:12px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft)}
.seg button{height:30px;padding:0 13px;border-radius:9px;font-size:13px;font-weight:500;color:var(--ink-3);transition:.16s var(--ease)}
.seg button[aria-pressed="true"]{background:var(--glass-strong);color:var(--ink);box-shadow:var(--lift-1),inset 0 1px 0 var(--edge-hi)}
.seg button:hover{color:var(--ink)}

.avatar{
  width:28px;height:28px;border-radius:50%;flex:none;
  display:grid;place-items:center;font-size:11px;font-weight:600;letter-spacing:0;
  color:#fff;box-shadow:0 0 0 2px var(--paper),inset 0 1px 0 rgba(255,255,255,.35);
}
.avatar.sq{border-radius:9px}

/* ============================================================
   views
   ============================================================ */
main{position:relative;z-index:1}
.view{display:none;position:relative;z-index:1}
html[data-view="landing"] .view-landing,
html[data-view="workspaces"] .view-workspaces,
html[data-view="canvas"] .view-canvas,
html[data-view="nodes"] .view-nodes{display:block}
html[data-view="canvas"],html[data-view="canvas"] body{overflow:hidden;height:100%}

.wrap{width:min(1240px,calc(100% - 48px));margin-inline:auto}
/* ============================================================
   nav
   ============================================================ */
.topnav{
  position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:60;
  width:min(1240px,calc(100% - 32px));
  display:flex;align-items:center;gap:16px;
  height:58px;padding:0 10px 0 18px;border-radius:17px;
}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--f-display);font-weight:600;font-size:18px;letter-spacing:-.03em}
.prism{width:24px;height:24px;flex:none}
.navlinks{display:flex;gap:2px;margin-left:14px}
.navlinks a{padding:7px 12px;border-radius:9px;font-size:14px;color:var(--ink-2);transition:.16s var(--ease)}
.navlinks a:hover{color:var(--ink);background:var(--glass-quiet)}
.navspace{flex:1}
.themetoggle{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:var(--ink-2);background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft)}
.themetoggle:hover{color:var(--ink)}

/* ============================================================
   hero — the page opens on the board; the headline is written on it
   ============================================================ */
.hero{position:relative;min-height:min(786px,100vh);padding:130px 0 42px;overflow:hidden}
.hero-canvas{position:absolute;inset:0;z-index:0}
.hero-canvas > svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.hero-grid{position:absolute;inset:0;
  background-image:radial-gradient(circle at 1px 1px,var(--grid) 1px,transparent 0);
  background-size:26px 26px;
  -webkit-mask-image:radial-gradient(115% 95% at 62% 44%,#000 18%,transparent 80%);
  mask-image:radial-gradient(115% 95% at 62% 44%,#000 18%,transparent 80%);
  opacity:.55}

/* the node scene never competes with the copy: it dissolves into the paper
   on its left edge, and it scales instead of disappearing on smaller screens */
.hero-scene{position:absolute;left:calc(50% - 52px);top:128px;width:820px;height:620px;z-index:2;
  transform-origin:0 0;
  -webkit-mask-image:linear-gradient(96deg,transparent 0,#000 6%);
  mask-image:linear-gradient(96deg,transparent 0,#000 6%)}
.hero-scene > svg{position:absolute;inset:0;width:820px;height:620px;overflow:visible}
.float{position:absolute;opacity:0;transform:translateY(14px) scale(.97);animation:place .8s var(--ease) forwards}
@keyframes place{to{opacity:1;transform:none}}

@media (max-width:1400px){
  .hero{min-height:auto;padding-bottom:58px}
  .hero-inner{grid-template-columns:minmax(0,530px)}
  .hero-scene{left:auto;right:-24px;transform-origin:100% 0;transform:scale(.86)}
}
@media (max-width:1180px){.hero-scene{right:-34px;transform:scale(.74)}}
@media (max-width:1080px){.hero-scene{right:-30px;transform:scale(.6)}}
@media (max-width:1000px){
  .hero{min-height:auto;padding:118px 0 372px}
  .hero-inner{grid-template-columns:minmax(0,600px)}
  .hero-scene{left:-26px;right:auto;top:auto;bottom:16px;transform-origin:0 100%;transform:scale(.55);
    -webkit-mask-image:linear-gradient(transparent 0,#000 20%);
    mask-image:linear-gradient(transparent 0,#000 20%)}
}
@media (max-width:820px){.hero{padding:112px 0 24px}.hero-scene{display:none}}

/* copy sits directly on the board — no card */
.hero-inner{position:relative;z-index:3;display:grid;grid-template-columns:minmax(0,560px)}
.command h1{margin-bottom:20px}
.command .lede{margin-bottom:32px}

/* the composer is the one piece of chrome, because it is a real control */
.composer{
  display:flex;align-items:center;gap:10px;padding:9px 9px 9px 17px;border-radius:16px;
  background:var(--glass-strong);backdrop-filter:blur(20px) saturate(125%);-webkit-backdrop-filter:blur(20px) saturate(125%);
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-1);
}
.composer input{flex:1;background:none;border:0;outline:0;font-size:15px;color:var(--ink);min-width:0}
.composer input::placeholder{color:var(--ink-3)}
.roster{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px;align-items:center}
.roster .tiny{margin-right:2px}

.hero-foot{position:relative;z-index:3;display:flex;gap:12px 34px;flex-wrap:wrap;align-items:center;
  margin-top:64px;padding-top:22px;border-top:1px solid var(--hairline-soft)}
.hero-foot .small{display:flex;align-items:center;gap:8px}

/* mini node chrome used in hero + previews */
.mini{font-size:12px;line-height:1.35}
.mini-sticky{width:150px;padding:11px 12px;border-radius:var(--r-sticky);color:#312a1c;
  background:linear-gradient(170deg,#FFE9A8,#FFDD84);box-shadow:var(--lift-node)}
.mini-card{padding:11px 13px;border-radius:var(--r-node);background:var(--node-fill);
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mini-cap{font-size:10.5px;letter-spacing:.02em;color:var(--ink-3);margin-bottom:4px}

.cursor{position:absolute;display:flex;align-items:flex-start;gap:0;pointer-events:none;z-index:4;transition:transform 2.4s cubic-bezier(.5,0,.2,1)}
.cursor svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.28))}
.cursor span{margin:12px 0 0 -2px;padding:3px 9px 4px;border-radius:8px;color:#fff;font-size:11.5px;font-weight:600;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.28)}

/* ============================================================
   sections
   ============================================================ */
.band{padding:86px 0;position:relative;z-index:1}
.band-head{max-width:60ch;margin-bottom:46px}
.band-head h2{margin-bottom:14px}

/* modes */
.modes{display:grid;grid-template-columns:250px minmax(0,1fr);gap:28px;align-items:start}
.modelist{display:grid;gap:8px}
.modebtn{text-align:left;padding:15px 16px;border-radius:15px;transition:.2s var(--ease);color:var(--ink-2);background:transparent;box-shadow:inset 0 0 0 1px transparent}
.modebtn strong{display:block;font-size:15px;font-weight:600;color:var(--ink);letter-spacing:-.01em;margin-bottom:3px}
.modebtn[aria-pressed="true"]{background:var(--glass);backdrop-filter:blur(18px) saturate(120%);-webkit-backdrop-filter:blur(18px) saturate(120%);box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-1)}
.modebtn:hover{color:var(--ink)}
.stage{position:relative;height:460px;border-radius:24px;overflow:hidden;background:var(--paper);box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-2)}
.stage-grid{position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,var(--grid) 1px,transparent 0);background-size:24px 24px;opacity:.6}
.stage-pane{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .32s var(--ease)}
.stage-pane[data-on="1"]{opacity:1;visibility:visible}

/* team rail */
.rail{display:flex;gap:14px;overflow-x:auto;padding:6px 4px 20px;scroll-snap-type:x mandatory;margin-inline:-4px}
.rail::-webkit-scrollbar{height:6px}
.rail::-webkit-scrollbar-thumb{background:var(--hairline);border-radius:999px}
.agentcard{flex:none;width:266px;scroll-snap-align:start;padding:20px;border-radius:20px;position:relative;overflow:hidden}
.agentcard .aura{position:absolute;width:200px;height:200px;right:-80px;top:-90px;border-radius:50%;filter:blur(60px);opacity:.14}
.agentcard h3{font-size:16.5px;font-weight:600;letter-spacing:-.015em;margin-bottom:1px}
.agentcard .role{font-size:12.5px;color:var(--ink-3);margin-bottom:15px}
.agentcard ul{display:grid;gap:6px;margin-top:14px;padding-top:14px;border-top:1px solid var(--hairline-soft)}
.agentcard li{font-size:12.5px;color:var(--ink-2);display:flex;gap:8px;align-items:baseline}
.agentcard li::before{content:"";width:4px;height:4px;border-radius:50%;background:var(--ink-4);flex:none;transform:translateY(-2px)}
.agenthead{display:flex;gap:12px;align-items:center;margin-bottom:2px;position:relative}

/* traceability chain */
.chain{display:grid;gap:0;position:relative}
.link{display:grid;grid-template-columns:150px 1fr;gap:20px;align-items:center;padding:14px 0}
.link + .link{border-top:1px solid var(--hairline-soft)}
.rel{justify-self:end;font-family:var(--f-mono);font-size:11px;color:var(--ink-3);padding:3px 8px;border-radius:6px;background:var(--glass-quiet)}
.linknode{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:14px;background:var(--glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:inset 0 0 0 1px var(--hairline)}
.linknode b{font-weight:600;font-size:14.5px;letter-spacing:-.01em}
.linknode .tiny{margin-left:auto}

/* split panels */
.split{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:22px;align-items:start}
.panelcard{padding:26px;border-radius:22px}
.panelcard h3{font-size:19px;font-weight:600;letter-spacing:-.02em;margin-bottom:9px;font-family:var(--f-display);font-variation-settings:'wdth' 95}
.panelcard p{font-size:14px;color:var(--ink-2);line-height:1.55}

.termline{display:flex;gap:10px;padding:5px 0;font-family:var(--f-mono);font-size:12px;color:var(--ink-2);align-items:baseline}
.termline em{font-style:normal;color:var(--ink-4);flex:none;width:56px}
.termline b{font-weight:500;color:var(--ink)}

.runcard{padding:16px;border-radius:16px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft)}
.runrow{display:flex;align-items:center;gap:10px;padding:8px 0;font-size:13px}
.runrow + .runrow{border-top:1px solid var(--hairline-soft)}
.runrow .st{margin-left:auto;font-size:11.5px;color:var(--ink-3)}
.bar{height:5px;border-radius:999px;background:var(--shade);overflow:hidden;flex:1;max-width:110px}
.bar i{display:block;height:100%;border-radius:999px}

/* cta + footer */
.cta{padding:64px 44px;border-radius:30px;text-align:center;position:relative;overflow:hidden}
.cta h2{margin-bottom:16px}
.cta .lede{margin-inline:auto;text-align:center}
.cta .row{display:flex;gap:12px;justify-content:center;margin-top:30px;flex-wrap:wrap}
footer{padding:56px 0 44px;border-top:1px solid var(--hairline-soft);margin-top:80px}
.footgrid{display:grid;grid-template-columns:1.6fr repeat(3,1fr);gap:30px}
.footgrid h4{font-size:12px;font-weight:600;color:var(--ink-3);margin-bottom:12px}
.footgrid a{display:block;font-size:13.5px;color:var(--ink-2);padding:3px 0}
.footgrid a:hover{color:var(--ink)}
/* ============================================================
   WORKSPACES — home
   ============================================================ */
.app{display:grid;grid-template-columns:238px minmax(0,1fr);min-height:100vh}
.rail-left{position:sticky;top:0;height:100vh;padding:18px 14px;display:flex;flex-direction:column;gap:20px}
.rail-left .brand{padding:6px 8px 2px}
.navgroup{display:grid;gap:2px}
.navgroup h4{font-size:11px;font-weight:600;color:var(--ink-4);padding:12px 10px 6px;letter-spacing:.01em}
.navitem{display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:10px;font-size:14px;color:var(--ink-2);transition:.16s var(--ease);width:100%;text-align:left}
.navitem:hover{background:var(--glass-quiet);color:var(--ink)}
.navitem[aria-current="page"]{background:var(--glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:var(--ink);font-weight:500;box-shadow:inset 0 0 0 1px var(--hairline-soft)}
.navitem .k{margin-left:auto;font-size:11px;color:var(--ink-4)}
.rail-left .foot{margin-top:auto;display:flex;align-items:center;gap:10px;padding:10px;border-radius:13px;background:var(--glass-quiet)}

.canvas-page{padding:26px 30px 60px;min-width:0}
.wsbar{display:flex;align-items:center;gap:14px;margin-bottom:30px}
.searchbox{display:flex;align-items:center;gap:9px;height:38px;padding:0 14px;border-radius:11px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft);flex:1;max-width:380px}
.searchbox input{background:none;border:0;outline:0;font-size:14px;width:100%}
.searchbox input::placeholder{color:var(--ink-4)}

.startcard{padding:28px;border-radius:24px;margin-bottom:34px;position:relative;overflow:hidden}
.startcard h2{font-size:27px;margin-bottom:8px;font-family:var(--f-display);font-weight:600;letter-spacing:-.03em;font-variation-settings:'wdth' 94}
.startcard .aura{position:absolute;inset:auto -80px -140px auto;width:380px;height:380px;border-radius:50%;filter:blur(90px);opacity:.10;
  background:radial-gradient(circle,var(--h-design),transparent 70%)}

.sechead{display:flex;align-items:baseline;gap:12px;margin:34px 0 16px}
.sechead h3{font-size:15.5px;font-weight:600;letter-spacing:-.015em}
.sechead .tiny{color:var(--ink-4)}
.sechead .more{margin-left:auto;font-size:13px;color:var(--ink-3)}

.boards{display:grid;grid-template-columns:repeat(auto-fill,minmax(288px,1fr));gap:18px}
.board{padding:0;border-radius:20px;overflow:hidden;text-align:left;width:100%;transition:transform .22s var(--ease),box-shadow .22s var(--ease);display:block}
.board:hover{transform:translateY(-3px);box-shadow:var(--lift-2)}
.thumb{height:146px;position:relative;overflow:hidden;background:var(--paper);border-bottom:1px solid var(--hairline-soft)}
.thumb .g{position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,var(--grid) 1px,transparent 0);background-size:16px 16px;opacity:.55}
.board-body{padding:14px 16px 15px}
.board-body h4{font-size:15px;font-weight:600;letter-spacing:-.015em;margin-bottom:3px}
.board-meta{display:flex;align-items:center;gap:8px;margin-top:12px}
.stack-av{display:flex}
.stack-av .avatar{width:23px;height:23px;font-size:9.5px;margin-left:-6px}
.stack-av .avatar:first-child{margin-left:0}
.live{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ink-3)}
.pulse{width:6px;height:6px;border-radius:50%;position:relative}
.pulse::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:1px solid currentColor;opacity:.4;animation:ping 2s infinite}
@keyframes ping{0%{transform:scale(.6);opacity:.6}100%{transform:scale(1.5);opacity:0}}

.overview{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:8px;align-items:start}
.progrow{display:flex;align-items:center;gap:12px;padding:9px 0;font-size:13.5px}
.progrow + .progrow{border-top:1px solid var(--hairline-soft)}
.progrow .bar{max-width:none}
.progrow .pct{width:38px;text-align:right;font-size:12px;color:var(--ink-3)}
.attn{display:flex;gap:11px;padding:11px 0;font-size:13.5px;align-items:flex-start}
.attn + .attn{border-top:1px solid var(--hairline-soft)}
.attn .tiny{display:block;margin-top:1px}

/* ============================================================
   CANVAS — chrome
   ============================================================ */
.canvasview{position:fixed;inset:0;overflow:hidden}
#viewport{position:absolute;inset:0;background:var(--paper);cursor:grab;touch-action:none}
#viewport.grabbing{cursor:grabbing}
#viewport .dots{position:absolute;inset:-4000px;background-image:radial-gradient(circle at 1px 1px,var(--grid) 1px,transparent 0);background-size:24px 24px;opacity:.65}
#world{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
#wires{position:absolute;left:0;top:0;width:4600px;height:3000px;overflow:visible;pointer-events:none}

.bar-top{position:absolute;top:14px;left:14px;right:14px;z-index:40;height:54px;display:flex;align-items:center;gap:12px;padding:0 12px;border-radius:16px}
.boardname{display:flex;align-items:center;gap:9px;min-width:0}
.boardname b{font-size:14.5px;font-weight:600;letter-spacing:-.015em;white-space:nowrap}
.crumb{font-size:13px;color:var(--ink-3);white-space:nowrap}
.bar-top .spacer{flex:1}
.presence{display:flex;align-items:center;gap:0}
.presence .avatar{margin-left:-7px;width:30px;height:30px;position:relative;transition:transform .18s var(--ease)}
.presence .avatar:first-child{margin-left:0}
.presence .avatar:hover{transform:translateY(-2px)}
.presence .avatar .badge{position:absolute;right:-2px;bottom:-2px;width:13px;height:13px;border-radius:50%;display:grid;place-items:center;font-size:7.5px;font-weight:700;background:var(--paper);color:var(--ink-2);box-shadow:0 0 0 1.5px var(--paper)}

.tools{position:absolute;left:14px;top:50%;transform:translateY(-50%);z-index:40;padding:7px;border-radius:17px;display:grid;gap:3px}
.tool{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:var(--ink-2);position:relative;transition:.15s var(--ease)}
.tool:hover{background:var(--glass-quiet);color:var(--ink)}
.tool[aria-pressed="true"]{background:var(--btn);color:var(--btn-ink);box-shadow:var(--lift-1)}
.tool .tip{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%) translateX(-4px);white-space:nowrap;
  padding:5px 9px;border-radius:8px;background:var(--btn);color:var(--btn-ink);font-size:11.5px;font-weight:500;
  opacity:0;pointer-events:none;transition:.16s var(--ease)}
.tool:hover .tip{opacity:1;transform:translateY(-50%)}
.tool .tip i{font-style:normal;opacity:.55;margin-left:6px}
.toolsep{height:1px;background:var(--hairline-soft);margin:4px 6px}

.dock{position:absolute;right:14px;top:80px;bottom:14px;width:318px;z-index:40;border-radius:19px;display:flex;flex-direction:column;overflow:hidden}
.docktabs{display:flex;gap:2px;padding:9px 9px 0;flex:none}
.docktabs button{flex:1;height:31px;border-radius:9px;font-size:12.5px;font-weight:500;color:var(--ink-3);transition:.15s var(--ease)}
.docktabs button[aria-pressed="true"]{background:var(--glass-strong);color:var(--ink);box-shadow:inset 0 0 0 1px var(--hairline-soft)}
.dockbody{flex:1;overflow-y:auto;padding:12px 13px 16px;scrollbar-width:thin}
.dockbody::-webkit-scrollbar{width:8px}
.dockbody::-webkit-scrollbar-thumb{background:var(--hairline);border-radius:99px;border:2px solid transparent;background-clip:content-box}
.dockpane{display:none}
.dockpane[data-on="1"]{display:block}
.dockh{font-size:11px;font-weight:600;color:var(--ink-4);padding:12px 4px 8px;letter-spacing:.02em}
.dockh:first-child{padding-top:2px}

.teamrow{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:12px;transition:.15s var(--ease);width:100%;text-align:left}
.teamrow:hover{background:var(--glass-quiet)}
.teamrow .nm{font-size:13.5px;font-weight:500;letter-spacing:-.01em;display:block}
.teamrow .r{font-size:11.5px;color:var(--ink-3)}
.state{margin-left:auto;font-size:10.5px;font-weight:500;padding:3px 8px;border-radius:999px}
.state.working{color:var(--h-product);background:color-mix(in srgb,var(--h-product) 15%,transparent)}
.state.idle{color:var(--ink-3);background:var(--shade)}
.state.blocked{color:var(--h-sec);background:color-mix(in srgb,var(--h-sec) 15%,transparent)}
.state.review{color:var(--h-arch);background:color-mix(in srgb,var(--h-arch) 15%,transparent)}

.feed{display:grid;gap:1px}
.feeditem{display:grid;grid-template-columns:26px 1fr;gap:10px;padding:9px 6px;border-radius:11px;position:relative}
.feeditem:hover{background:var(--glass-quiet)}
.feeditem .t{font-size:13px;line-height:1.45}
.feeditem .t b{font-weight:600}
.feeditem .when{font-size:11px;color:var(--ink-4);margin-top:2px;display:block}

.commentcard{padding:12px;border-radius:13px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft);margin-bottom:9px}
.commentcard .top{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.commentcard .top b{font-size:12.5px;font-weight:600}
.commentcard p{font-size:13px;color:var(--ink-2);line-height:1.5}
.commentcard .acts{display:flex;gap:6px;margin-top:10px}

.insprow{display:flex;align-items:center;gap:10px;padding:8px 4px;font-size:13px}
.insprow + .insprow{border-top:1px solid var(--hairline-soft)}
.insprow span:first-child{color:var(--ink-3);width:88px;flex:none;font-size:12.5px}
.insprow .v{margin-left:auto;font-family:var(--f-mono);font-size:11.5px;color:var(--ink)}
.swatches{display:flex;gap:6px;margin-left:auto}
.sw{width:19px;height:19px;border-radius:6px;box-shadow:inset 0 0 0 1px var(--hairline)}

/* run composer */
.runbar{position:absolute;left:50%;transform:translateX(-50%);bottom:18px;z-index:45;width:min(680px,calc(100% - 400px));border-radius:19px;padding:11px}
.runcomposer{display:flex;align-items:center;gap:10px}
.runcomposer .who{display:flex;align-items:center;gap:6px;padding:6px 10px 6px 7px;border-radius:10px;background:var(--glass-quiet);flex:none}
.runcomposer input{flex:1;background:none;border:0;outline:0;font-size:14px;min-width:0}
.runcomposer input::placeholder{color:var(--ink-3)}
.runstatus{display:none;padding:10px 4px 2px;border-top:1px solid var(--hairline-soft);margin-top:10px}
.runstatus[data-on="1"]{display:block}
.runline{display:flex;align-items:center;gap:9px;font-size:12.5px;padding:4px 0}
.runline .nm{font-weight:500;width:104px;flex:none}
.runline .ph{color:var(--ink-3);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.zoombar{position:absolute;left:14px;bottom:18px;z-index:40;display:flex;align-items:center;gap:2px;padding:5px;border-radius:13px}
.zoombar button{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;color:var(--ink-2)}
.zoombar button:hover{background:var(--glass-quiet);color:var(--ink)}
.zoombar .lvl{min-width:48px;text-align:center;font-size:12px;color:var(--ink-2);font-variant-numeric:tabular-nums}

.minimap{position:absolute;left:14px;bottom:66px;z-index:40;width:168px;height:110px;border-radius:13px;overflow:hidden;padding:0}
.minimap .mm{position:absolute;inset:0;background:var(--paper)}
.minimap i{position:absolute;border-radius:2px;display:block;opacity:.45}
.minimap .vp{position:absolute;border:1.5px solid var(--ink-2);border-radius:4px;background:color-mix(in srgb,var(--ink) 7%,transparent);opacity:1}
/* ============================================================
   CANVAS OBJECTS — 15 neutral types
   Shared spatial + collaboration shell first, then per-type.
   ============================================================ */
.n{position:absolute;font-size:13px;line-height:1.45;--own:transparent}
.n .lbl{position:absolute;left:0;top:-19px;font-size:10.5px;font-weight:600;color:var(--ink-3);white-space:nowrap;opacity:0;transition:opacity .15s}
.n:hover .lbl{opacity:1}

/* selection + authorship rings */
.n[data-sel]{outline:1.5px solid var(--own);outline-offset:3px;border-radius:inherit}
.n[data-sel]::after{content:attr(data-sel);position:absolute;left:-1px;top:-24px;padding:2px 7px 3px;border-radius:7px;
  background:var(--own);color:#fff;font-size:10.5px;font-weight:600;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,.24)}
.n[data-by]{box-shadow:var(--lift-node),0 0 0 1px color-mix(in srgb,var(--own) 55%,transparent),0 0 22px -6px var(--own)}
.n[data-lock] .lockpin{position:absolute;right:6px;top:6px;color:var(--ink-4)}

/* comment pin */
.pin{position:absolute;width:24px;height:24px;border-radius:11px 11px 11px 2px;display:grid;place-items:center;
  color:#fff;font-size:10.5px;font-weight:700;box-shadow:0 4px 10px rgba(0,0,0,.3);cursor:pointer;z-index:6}
.pin:hover{transform:scale(1.08)}

/* editing lease */
.leased{position:relative}
.leased::before{content:"";position:absolute;inset:-3px;border-radius:inherit;border:1.5px dashed var(--own);opacity:.75;pointer-events:none}

/* 1 ── SHAPE ------------------------------------------------ */
.n-shape{display:grid;place-items:center;text-align:center;padding:10px 14px;font-weight:500;letter-spacing:-.01em;
  background:var(--node-fill);color:var(--ink);
  box-shadow:inset 0 0 0 1.25px var(--wire-soft),var(--lift-node);
  backdrop-filter:blur(12px) saturate(160%);-webkit-backdrop-filter:blur(12px) saturate(160%)}
.v-rectangle{border-radius:9px}
.v-pill{border-radius:999px}
.v-circle{border-radius:50%}
.v-diamond{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);border-radius:0;padding:10px 24px;box-shadow:none;background:var(--node-fill);position:relative}
.v-diamond::before{content:"";position:absolute;inset:0;clip-path:inherit;box-shadow:inset 0 0 0 1.25px var(--wire-soft);pointer-events:none}
.v-parallelogram{clip-path:polygon(14% 0,100% 0,86% 100%,0 100%);border-radius:0}
.v-trapezoid{clip-path:polygon(13% 0,87% 0,100% 100%,0 100%);border-radius:0}
.v-triangle{clip-path:polygon(50% 4%,100% 100%,0 100%);border-radius:0;align-items:end;padding-bottom:12px}
.v-hexagon{clip-path:polygon(24% 0,76% 0,100% 50%,76% 100%,24% 100%,0 50%);border-radius:0}
.v-cylinder{border-radius:50%/16px 16px 16px 16px;position:relative;overflow:hidden}
.v-cylinder{padding-top:24px}
.v-cylinder::before{content:"";position:absolute;left:0;right:0;top:0;height:22px;border-radius:50%;
  background:var(--shade);box-shadow:inset 0 -1px 0 var(--wire-soft)}
.v-cloud{background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}
.v-star{clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);border-radius:0;font-size:11px}
.v-actor{background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;gap:4px;grid-auto-rows:min-content}
.v-bracket{background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;
  border-left:2px solid var(--wire);border-radius:0;justify-items:start;text-align:left;padding-left:12px}
.v-line{background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;padding:0}

.shape-ic{display:flex;align-items:center;gap:7px}
.shape-ic svg{flex:none;opacity:.72}

/* semantic tag on a shape */
.semtag{position:absolute;left:9px;top:-9px;padding:1.5px 7px 2px;border-radius:5px;font-family:var(--f-mono);font-size:9.5px;
  background:var(--paper);color:var(--ink-3);box-shadow:inset 0 0 0 1px var(--hairline)}

/* 2 ── STICKY ----------------------------------------------- */
.n-sticky{border-radius:var(--r-sticky);padding:13px 14px 30px;color:#312a1c;
  box-shadow:var(--lift-node),inset 0 1px 0 rgba(255,255,255,.5);font-weight:450}
.n-sticky .foot{position:absolute;left:14px;right:12px;bottom:9px;display:flex;align-items:center;gap:6px;
  font-size:10.5px;color:rgba(0,0,0,.46);font-weight:600}
.n-sticky .prio{margin-left:auto;padding:1px 6px;border-radius:5px;background:rgba(0,0,0,.11);letter-spacing:.02em}
  .s-amber{background:linear-gradient(170deg,#FFE9A8,#FFDD84)}
.s-mint{background:linear-gradient(170deg,#C8EFD8,#A8E3C2)}
.s-peach{background:linear-gradient(170deg,#FFDFC6,#FFC9A2)}
.s-lilac{background:linear-gradient(170deg,#E4DAFA,#CEBEF4)}
.s-rose{background:linear-gradient(170deg,#FFD8D8,#FFBABA)}

/* 3 ── TEXT ------------------------------------------------- */
.n-text{background:none;box-shadow:none;color:var(--ink)}
.n-text h5{font-family:var(--f-display);font-weight:600;font-size:19px;letter-spacing:-.025em;margin-bottom:5px;font-variation-settings:'wdth' 96}
.n-text p{font-size:13px;color:var(--ink-2);line-height:1.55}

/* 4 ── MIND MAP NODE ---------------------------------------- */
.n-mind{border-radius:999px;padding:9px 17px;font-weight:500;background:var(--node-fill);
  box-shadow:inset 0 0 0 1.25px var(--wire-soft),var(--lift-node);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);white-space:nowrap;display:flex;align-items:center;gap:8px}
.n-mind.root{background:var(--btn);color:var(--btn-ink);font-family:var(--f-display);font-size:15px;padding:12px 22px;box-shadow:var(--lift-2)}
.n-mind .cnt{font-size:10.5px;color:var(--ink-3);background:var(--shade);border-radius:99px;padding:1px 6px}

/* 5 ── TABLE ------------------------------------------------ */
.n-table{border-radius:var(--r-node);overflow:hidden;background:var(--node-fill);
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.n-table .cap{padding:9px 12px;font-size:12px;font-weight:600;border-bottom:1px solid var(--hairline);display:flex;align-items:center;gap:7px}
.n-table table{width:100%;border-collapse:collapse;font-size:11.5px}
.n-table th{text-align:left;font-weight:600;color:var(--ink-3);padding:6px 12px;font-size:10.5px;background:var(--shade)}
.n-table td{padding:6px 12px;border-top:1px solid var(--hairline-soft);color:var(--ink-2)}
.n-table td:first-child{color:var(--ink);font-weight:500}
.n-table .k{font-family:var(--f-mono);font-size:10px}

/* 6 ── ICON ------------------------------------------------- */
.n-icon{display:grid;justify-items:center;gap:6px;background:none;box-shadow:none}
.n-icon .box{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:var(--node-fill);
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.n-icon .cap{font-size:11px;color:var(--ink-2);font-weight:500}

/* 7 ── IMAGE ------------------------------------------------ */
.n-image{border-radius:var(--r-node);overflow:hidden;box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node);background:var(--paper-2)}
.n-image .ph{width:100%;height:100%;display:grid;place-items:center;gap:6px;align-content:center;
  background:
    linear-gradient(135deg,var(--shade) 25%,transparent 25%) 0 0/12px 12px,
    linear-gradient(225deg,var(--shade) 25%,transparent 25%) 0 0/12px 12px,
    var(--paper-2);
  color:var(--ink-4);font-size:11px}

/* 8 ── LINK / EMBED ----------------------------------------- */
.n-link{border-radius:var(--r-node);padding:11px 13px;display:flex;gap:11px;align-items:flex-start;background:var(--node-fill);
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.n-link .fav{width:30px;height:30px;border-radius:8px;flex:none;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff}
.n-link b{font-size:12.5px;font-weight:600;display:block;letter-spacing:-.01em}
.n-link .u{font-family:var(--f-mono);font-size:10.5px;color:var(--ink-3);margin-top:2px;display:block}

/* 9 ── SECTION ---------------------------------------------- */
.n-section{border-radius:20px;background:var(--glass-quiet);
  box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--own) 46%,var(--hairline));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.n-section > .hd{position:absolute;left:16px;top:-15px;display:flex;align-items:center;gap:9px;
  padding:4px 12px 5px;border-radius:9px;background:var(--paper);
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node)}
.n-section > .hd b{font-size:11.5px;font-weight:600;letter-spacing:.04em;color:var(--ink-2)}
.n-section > .hd .cnt{font-size:10.5px;color:var(--ink-4)}
.n-section > .glow{position:absolute;inset:14px;border-radius:16px;filter:blur(40px);opacity:.16;
  background:radial-gradient(circle at 30% 20%,var(--own),transparent 70%);pointer-events:none}

/* 10 ── ANNOTATION ------------------------------------------ */
.n-annot{padding:9px 12px;border-radius:11px 11px 11px 3px;font-size:12px;line-height:1.45;
  background:color-mix(in srgb,var(--own) 16%,var(--paper-2));color:var(--ink);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--own) 42%,transparent),var(--lift-node)}
.n-annot .who{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;color:var(--own);margin-bottom:4px}

/* 11 ── DRAWING --------------------------------------------- */
.n-draw{background:none;box-shadow:none}
.n-draw svg{overflow:visible}
.n-draw path{fill:none;stroke-linecap:round;stroke-linejoin:round}

/* 12 ── TASK ------------------------------------------------ */
.n-task{border-radius:var(--r-node);padding:12px 13px;background:var(--node-fill);
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.n-task .tt{font-size:13px;font-weight:600;letter-spacing:-.01em;margin-bottom:7px;line-height:1.35}
.n-task .checks{display:grid;gap:4px;margin:8px 0 10px}
.n-task .ck{display:flex;gap:7px;align-items:center;font-size:11.5px;color:var(--ink-2)}
.n-task .ck i{width:12px;height:12px;border-radius:4px;flex:none;box-shadow:inset 0 0 0 1.25px var(--wire-soft);display:grid;place-items:center}
.n-task .ck.done{color:var(--ink-3);text-decoration:line-through;text-decoration-color:var(--ink-4)}
.n-task .ck.done i{background:var(--h-product);box-shadow:none}
.n-task .tfoot{display:flex;align-items:center;gap:6px;padding-top:9px;border-top:1px solid var(--hairline-soft)}
.tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;letter-spacing:.01em}
.n-task .avatar{width:20px;height:20px;font-size:8.5px;margin-left:auto;box-shadow:none}

/* 13 ── STACK ----------------------------------------------- */
.n-stack{border-radius:16px;padding:10px;background:var(--glass-quiet);
  box-shadow:inset 0 0 0 1px var(--hairline-soft);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  display:flex;flex-direction:column;gap:8px}
.n-stack > .sh{display:flex;align-items:center;gap:8px;padding:1px 4px 7px;border-bottom:1px solid var(--hairline-soft)}
.n-stack > .sh b{font-size:11.5px;font-weight:600;letter-spacing:.02em;color:var(--ink-2)}
.n-stack > .sh .cnt{margin-left:auto;font-size:10.5px;color:var(--ink-4);background:var(--shade);border-radius:99px;padding:1px 7px}
.n-stack .n-task{position:relative;left:auto;top:auto;width:100%}
.n-stack .add{height:30px;border-radius:9px;font-size:11.5px;color:var(--ink-4);display:grid;place-items:center;
  box-shadow:inset 0 0 0 1px var(--hairline-soft)}

/* 14 ── WIREFRAME FRAME ------------------------------------- */
.n-wf{border-radius:var(--r-frame);background:var(--paper-2);overflow:hidden;
  box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node)}
.n-wf > .chrome{height:26px;display:flex;align-items:center;gap:6px;padding:0 9px;border-bottom:1px solid var(--hairline-soft);background:var(--shade)}
.n-wf > .chrome .dots{display:flex;gap:4px}
.n-wf > .chrome .dots i{width:6px;height:6px;border-radius:50%;background:var(--ink-4);opacity:.55}
.n-wf > .chrome .url{flex:1;height:14px;border-radius:4px;background:var(--paper);box-shadow:inset 0 0 0 1px var(--hairline-soft);
  font-size:8.5px;color:var(--ink-4);padding:0 6px;display:flex;align-items:center;font-family:var(--f-mono)}
.n-wf.mobile{border-radius:20px;padding:6px}
.n-wf.mobile > .chrome{height:18px;border:0;background:none;justify-content:space-between;padding:0 8px;font-size:8px;color:var(--ink-3);font-family:var(--f-mono)}
.n-wf.mobile > .screen{border-radius:15px;background:var(--paper-2);box-shadow:inset 0 0 0 1px var(--hairline-soft)}
.n-wf > .screen{padding:12px;display:grid;gap:9px;align-content:start}
.n-wf .flbl{position:absolute;left:1px;top:-18px;font-size:10.5px;font-weight:600;color:var(--ink-3);display:flex;align-items:center;gap:6px}

/* 15 ── WIREFRAME COMPONENT --------------------------------- */
.wc{--wc:var(--wire)}
.wc-btn{height:30px;border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:600;
  background:var(--ink);color:var(--paper-2)}
.wc-btn.ghost{background:none;color:var(--ink-2);box-shadow:inset 0 0 0 1.25px var(--wire-soft)}
.wc-input{height:30px;border-radius:7px;box-shadow:inset 0 0 0 1.25px var(--wire-soft);display:flex;align-items:center;
  padding:0 9px;font-size:10.5px;color:var(--ink-4)}
.wc-textarea{height:56px;border-radius:7px;box-shadow:inset 0 0 0 1.25px var(--wire-soft);padding:7px 9px;font-size:10.5px;color:var(--ink-4)}
.wc-check{display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--ink-2)}
.wc-check i{width:12px;height:12px;border-radius:3px;box-shadow:inset 0 0 0 1.25px var(--wire-soft);flex:none}
.wc-radio i{border-radius:50%}
.wc-select{height:30px;border-radius:7px;box-shadow:inset 0 0 0 1.25px var(--wire-soft);display:flex;align-items:center;
  justify-content:space-between;padding:0 9px;font-size:10.5px;color:var(--ink-4)}
.wc-tabs{display:flex;gap:2px;padding:2.5px;border-radius:8px;background:var(--shade)}
.wc-tabs span{flex:1;height:22px;border-radius:6px;display:grid;place-items:center;font-size:10px;color:var(--ink-3)}
.wc-tabs span.on{background:var(--paper-2);color:var(--ink);font-weight:600;box-shadow:var(--lift-node)}
.wc-nav{display:flex;align-items:center;gap:10px;padding-bottom:8px;border-bottom:1px solid var(--hairline-soft)}
.wc-nav b{font-size:11px;font-weight:700}
.wc-nav span{font-size:10px;color:var(--ink-3)}
.wc-menu{border-radius:8px;box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-node);background:var(--paper-2);padding:4px;display:grid;gap:1px}
.wc-menu span{padding:5px 8px;border-radius:5px;font-size:10.5px;color:var(--ink-2)}
.wc-menu span.on{background:var(--shade);color:var(--ink)}
.wc-table{border-radius:7px;overflow:hidden;box-shadow:inset 0 0 0 1.25px var(--wire-soft)}
.wc-table .r{display:grid;grid-template-columns:1.4fr 1fr .7fr;gap:8px;padding:6px 9px;font-size:10px;color:var(--ink-2)}
.wc-table .r.h{background:var(--shade);font-weight:600;color:var(--ink-3);font-size:9.5px}
.wc-table .r + .r{border-top:1px solid var(--hairline-soft)}
.wc-avatar{width:26px;height:26px;border-radius:50%;background:var(--shade);box-shadow:inset 0 0 0 1.25px var(--wire-soft)}
.wc-card{border-radius:8px;padding:9px;box-shadow:inset 0 0 0 1.25px var(--wire-soft);display:grid;gap:6px}
.wc-line{height:7px;border-radius:99px;background:var(--shade)}
.wc-modal{border-radius:10px;background:var(--paper-2);box-shadow:inset 0 0 0 1px var(--hairline),var(--lift-2);padding:11px;display:grid;gap:8px}
.wc-rect{border-radius:6px;box-shadow:inset 0 0 0 1.25px var(--wire-soft)}
.wc-circle{border-radius:50%;box-shadow:inset 0 0 0 1.25px var(--wire-soft)}
.wc-hr{height:1.25px;background:var(--wire-soft)}

/* connector labels drawn in HTML above the SVG */
.elabel{position:absolute;transform:translate(-50%,-50%);padding:2.5px 8px;border-radius:6px;font-family:var(--f-mono);
  font-size:10px;color:var(--ink-3);background:var(--paper);box-shadow:inset 0 0 0 1px var(--hairline);white-space:nowrap;z-index:3}

/* live cursors on the board */
.ccursor{position:absolute;z-index:20;pointer-events:none;transition:transform 2.6s cubic-bezier(.45,0,.2,1)}
.ccursor .tagname{margin:11px 0 0 -1px;padding:3px 9px 4px;border-radius:8px;color:#fff;font-size:11px;font-weight:600;
  white-space:nowrap;display:inline-flex;gap:6px;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.ccursor .tagname em{font-style:normal;opacity:.72;font-weight:500}

/* ============================================================
   NODE SPEC SHEET
   ============================================================ */
.spec{padding:112px 0 90px}
.specgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.speccell{padding:18px;border-radius:20px;position:relative;min-height:210px;display:flex;flex-direction:column}
.speccell > .top{display:flex;align-items:baseline;gap:9px;margin-bottom:4px}
.speccell > .top b{font-size:14px;font-weight:600;letter-spacing:-.015em}
.speccell > .top .mono{color:var(--ink-4)}
.speccell > .desc{font-size:12.5px;color:var(--ink-2);margin-bottom:16px;line-height:1.5}
.stagebox{position:relative;flex:1;border-radius:14px;background:var(--paper);box-shadow:inset 0 0 0 1px var(--hairline-soft);
  min-height:126px;display:grid;place-items:center;padding:18px;overflow:hidden}
.stagebox .g{position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,var(--grid) 1px,transparent 0);background-size:16px 16px;opacity:.5}
.stagebox .n{position:relative;left:auto;top:auto}
.stagebox .abs{position:relative}
.stagebox .abs .n{position:absolute}
.variants{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}
.variants span{font-family:var(--f-mono);font-size:10px;color:var(--ink-3);padding:2.5px 7px;border-radius:5px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft)}
.statesrow{display:flex;flex-wrap:wrap;gap:34px 30px;align-items:flex-end;padding:36px 26px 30px;border-radius:20px;position:relative}
.statecase{display:grid;gap:10px;justify-items:center}
.statecase .cap{font-size:11px;color:var(--ink-3);font-weight:500}
.statecase .holder{position:relative;width:158px;height:98px}
.statecase .n{left:0;top:0}

/* ============================================================
   prototype view switcher
   ============================================================ */
.switcher{position:fixed;right:16px;bottom:16px;z-index:90;display:flex;align-items:center;gap:3px;padding:5px;border-radius:14px}
.switcher .tiny{padding:0 8px 0 6px;color:var(--ink-4)}
.switcher button{height:30px;padding:0 11px;border-radius:9px;font-size:12.5px;font-weight:500;color:var(--ink-3);transition:.15s var(--ease)}
.switcher button[aria-pressed="true"]{background:var(--btn);color:var(--btn-ink)}
.switcher button:hover{color:var(--ink)}
.switcher button[aria-pressed="true"]:hover{color:var(--btn-ink)}
html[data-view="canvas"] .switcher{right:auto;left:14px;bottom:188px}

/* ============================================================
   responsive
   ============================================================ */
@media (max-width:1180px){
  .minimap{display:none}
  .runbar{width:min(560px,calc(100% - 380px))}
}
@media (max-width:980px){
  .app{grid-template-columns:1fr}
  .rail-left{position:static;height:auto;flex-direction:row;align-items:center;overflow-x:auto;padding:12px}
  .rail-left .navgroup{display:flex;gap:2px}
  .rail-left .navgroup h4,.rail-left .foot{display:none}
  .modes{grid-template-columns:1fr}
  .modelist{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));display:grid}
  .dock{display:none}
  .runbar{width:calc(100% - 28px)}
  html[data-view="canvas"] .switcher{right:16px;left:auto;bottom:96px}
  .footgrid{grid-template-columns:1fr 1fr}
}
@media (max-width:880px){
  .navlinks{display:none}
  .topnav .btn-glass{display:none}
}
@media (max-width:720px){
  .wrap{width:calc(100% - 32px)}
  .topnav{height:52px;padding:0 8px 0 14px}
  .navlinks{display:none}
  .hero{padding:104px 0 64px}
  .command{padding:24px 22px 20px}
  .band{padding:70px 0}
  .link{grid-template-columns:1fr;gap:6px}
  .rel{justify-self:start}
  .canvas-page{padding:18px 16px 50px}
  .statesrow{gap:22px;padding:24px 18px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
</style>
</head>
<body>
<div id="substrate" aria-hidden="true">
  <b class="b1"></b><b class="b2"></b><b class="b3"></b><b class="b4"></b>
</div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<defs>
<linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#8B5CF0"/><stop offset=".38" stop-color="#D24D93"/>
  <stop offset=".7" stop-color="#E4823C"/><stop offset="1" stop-color="#2FA36B"/>
</linearGradient>
<symbol id="i-select" viewBox="0 0 24 24"><path d="M5 3l14 8.5-6.2 1.4L10 19.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-hand" viewBox="0 0 24 24"><path d="M8 11V5.6a1.4 1.4 0 012.8 0V11m0-1.2V4.4a1.4 1.4 0 012.8 0v5.4m0-.8a1.4 1.4 0 012.8 0V13m0-1.6a1.4 1.4 0 012.8 0v4.2c0 2.7-2.2 4.9-4.9 4.9h-1.9c-2 0-3.4-1-4.4-2.6L5 14.6c-.5-.9.6-2 1.5-1.4L8 14.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-shape" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="9" height="9" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="15.5" cy="15.5" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-sticky" viewBox="0 0 24 24"><path d="M4.5 4.5h15v9.6L14 19.5H4.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M19.5 14h-5.6v5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-text" viewBox="0 0 24 24"><path d="M5 6.5V5h14v1.5M12 5v14M9 19h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-mind" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="19" cy="6.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="19" cy="17.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.4 11.2l9.3-3.6M7.4 12.8l9.3 3.6" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-table" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9.5h17M9.5 9.5v10" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-image" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><path d="M4 17l4.6-4.2 4 3.4 3-2.4 4.4 3.7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-link" viewBox="0 0 24 24"><path d="M10.5 13.5a3.7 3.7 0 005.6.4l2.3-2.3a3.7 3.7 0 10-5.2-5.2l-1.3 1.3M13.5 10.5a3.7 3.7 0 00-5.6-.4l-2.3 2.3a3.7 3.7 0 105.2 5.2l1.3-1.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-section" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2.4"/><path d="M7 9.5h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-pen" viewBox="0 0 24 24"><path d="M4 20l1.2-4L15.8 5.4a2 2 0 012.8 0l.8.8a2 2 0 010 2.8L8.8 19.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-task" viewBox="0 0 24 24"><rect x="4" y="4.5" width="16" height="15" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.6 10.4l1.8 1.8 3.4-3.6M15 15.5h2.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></symbol>
<symbol id="i-stack" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="17" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="3.5" width="7" height="11" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-frame" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 8.5h17" stroke="currentColor" stroke-width="1.5"/><circle cx="6.4" cy="6.5" r=".8" fill="currentColor"/></symbol>
<symbol id="i-comp" viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="5" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3.5" y="14" width="10" height="4" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-connector" viewBox="0 0 24 24"><circle cx="5.5" cy="18.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18.5" cy="5.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.4 17C10 14 10 10 16.6 7.2" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-comment" viewBox="0 0 24 24"><path d="M4.5 5.6h15v10.2h-8L6.5 20v-4.2h-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M7.5 4.8l11 7.2-11 7.2z" fill="currentColor"/></symbol>
<symbol id="i-stop" viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></symbol>
<symbol id="i-undo" viewBox="0 0 24 24"><path d="M4.5 9.5h9.8a5 5 0 110 10H8M4.5 9.5l4-4M4.5 9.5l4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-fit" viewBox="0 0 24 24"><path d="M4 9V5.5A1.5 1.5 0 015.5 4H9M15 4h3.5A1.5 1.5 0 0120 5.5V9M20 15v3.5a1.5 1.5 0 01-1.5 1.5H15M9 20H5.5A1.5 1.5 0 014 18.5V15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.2A8.4 8.4 0 019.8 4 8.4 8.4 0 1020 14.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-board" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 17.5V21M8.5 21h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-team" viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.6 19.4c.5-3 2.7-4.8 5.4-4.8s4.9 1.8 5.4 4.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16 6.2a3 3 0 010 5.6M17.4 14.9c2 .6 3.3 2.3 3.6 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-activity" viewBox="0 0 24 24"><path d="M3.5 12.5h4L10 6l4 12 2.4-5.5h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-template" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9.5h17M9 9.5v10" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M19.2 14.4a1.5 1.5 0 00.3 1.7l.1.1a1.8 1.8 0 11-2.6 2.6l-.1-.1a1.5 1.5 0 00-2.6 1.1v.2a1.8 1.8 0 11-3.6 0v-.1a1.5 1.5 0 00-2.7-1.1l-.1.1a1.8 1.8 0 11-2.6-2.6l.1-.1a1.5 1.5 0 00-1.1-2.6h-.2a1.8 1.8 0 110-3.6h.1A1.5 1.5 0 005.8 7l-.1-.1A1.8 1.8 0 118.3 4.3l.1.1A1.5 1.5 0 0011 3.3a1.8 1.8 0 113.6 0v.1a1.5 1.5 0 002.6 1.1l.1-.1a1.8 1.8 0 112.6 2.6l-.1.1a1.5 1.5 0 001.1 2.6h.2a1.8 1.8 0 110 3.6h-.1a1.5 1.5 0 00-1.4.9z" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-history" viewBox="0 0 24 24"><path d="M3.8 12a8.2 8.2 0 108.2-8.2A8.2 8.2 0 005.4 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M3.6 3.6v3.6h3.6M12 7.6V12l3 1.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-inspect" viewBox="0 0 24 24"><path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-cursor" viewBox="0 0 18 22"><path d="M2 1.6l13.2 8-5.9 1.3-2.6 6z" fill="currentColor" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.8l4.6 4.4L19 6.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-db" viewBox="0 0 24 24"><ellipse cx="12" cy="6.5" rx="7" ry="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 6.5v11c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-11M5 12c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13.4 2.5L4.8 13.4h6L10.6 21.5l8.6-10.9h-6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7.4 2.8v5.5c0 4.5-3 8.2-7.4 9.7-4.4-1.5-7.4-5.2-7.4-9.7V5.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-cloud" viewBox="0 0 24 24"><path d="M7 18.5A4 4 0 016.6 10.6 5.6 5.6 0 0117.5 9.9a3.9 3.9 0 01.2 8.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
</defs>
</svg>

<!-- ══════════════════════════════════════════ LANDING ══════ -->
<section class="view view-landing">
<header class="topnav glass">
  <a class="brand" href="#" data-go="landing">
    <svg class="prism" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.4l9.2 16.1a1.4 1.4 0 01-1.2 2.1H4a1.4 1.4 0 01-1.2-2.1z" fill="url(#pg)" opacity=".92"/>
      <path d="M12 2.4l9.2 16.1a1.4 1.4 0 01-1.2 2.1H4a1.4 1.4 0 01-1.2-2.1z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>
      <path d="M12 7.6v12.9" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
    </svg>
    Guild
  </a>
  <nav class="navlinks">
    <a href="#modes">Canvas</a>
    <a href="#team">AI team</a>
    <a href="#trace">Traceability</a>
    <a href="#enter">Connect agents</a>
  </nav>
  <div class="navspace"></div>
  <button class="themetoggle" id="theme-1" aria-label="Switch to light mode"><svg width="17" height="17"><use href="#i-sun"/></svg></button>
  <button class="btn btn-sm btn-glass" data-go="workspaces">Sign in</button>
  <button class="btn btn-sm btn-primary" data-go="canvas">Open a board</button>
</header>

<div class="hero">
  <!-- the hero background is a real canvas: glass refracts product, not decoration -->
  <div class="hero-canvas" aria-hidden="true">
    <div class="hero-grid"></div>

    <div class="hero-scene">
      <svg viewBox="0 0 820 620" fill="none" stroke="var(--wire)" stroke-width="1.4">
        <path d="M220 100 C 232 100, 228 70, 238 70"/>
        <path d="M428 70 C 452 70, 448 150, 470 150"/>
        <path d="M136 160 C 136 216, 150 214, 152 268"/>
        <path d="M246 322 C 274 322, 272 440, 300 440"/>
        <path d="M572 240 C 600 240, 578 328, 596 330"/>
      </svg>

      <div class="float" style="left:52px;top:38px;animation-delay:.10s">
        <div class="mini mini-sticky" style="width:168px">
          <b style="font-size:12.5px">Merchants can't answer 300 tickets a day</b>
          <div style="margin-top:8px;font-size:10px;font-weight:600;opacity:.55">problem · P0</div>
        </div>
      </div>

      <div class="float" style="left:238px;top:8px;animation-delay:.26s">
        <div class="mini mini-card" style="width:190px">
          <div class="mini-cap">requirement</div>
          <b style="font-size:12.5px;letter-spacing:-.01em">Draft replies from order history</b>
        </div>
      </div>

      <div class="float" style="left:470px;top:92px;animation-delay:.42s">
        <div class="mini mini-card" style="width:200px;padding:0;overflow:hidden">
          <div style="height:22px;background:var(--shade);display:flex;align-items:center;gap:5px;padding:0 9px">
            <i style="width:5px;height:5px;border-radius:50%;background:var(--ink-4);opacity:.5"></i>
            <i style="width:5px;height:5px;border-radius:50%;background:var(--ink-4);opacity:.5"></i>
            <i style="width:5px;height:5px;border-radius:50%;background:var(--ink-4);opacity:.5"></i>
          </div>
          <div style="padding:11px;display:grid;gap:7px">
            <div class="wc-line" style="width:62%"></div>
            <div class="wc-line" style="width:88%"></div>
            <div class="wc-line" style="width:74%"></div>
            <div class="wc-btn" style="height:24px;font-size:9.5px">Send reply</div>
          </div>
        </div>
      </div>

      <div class="float" style="left:60px;top:268px;animation-delay:.58s">
        <div class="mini mini-card" style="width:186px;display:flex;align-items:center;gap:10px">
          <svg width="19" height="19" style="color:var(--h-arch);flex:none"><use href="#i-db"/></svg>
          <div><b style="font-size:12.5px">tickets</b><div style="font-size:10px;color:var(--ink-3)">Postgres · 4 tables</div></div>
        </div>
      </div>

      <div class="float" style="left:300px;top:396px;animation-delay:.74s">
        <div class="mini mini-card" style="width:206px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <i style="width:13px;height:13px;border-radius:4px;background:var(--h-product);display:grid;place-items:center;flex:none">
              <svg width="8" height="8" style="color:#fff"><use href="#i-check"/></svg></i>
            <b style="font-size:12.5px">Draft-reply endpoint</b>
          </div>
          <div style="display:flex;gap:5px">
            <span class="tag" style="background:color-mix(in srgb,var(--h-impl) 22%,transparent);color:var(--ink-2)">backend</span>
            <span class="tag" style="background:color-mix(in srgb,var(--h-sec) 18%,transparent);color:var(--h-sec)">P0</span>
          </div>
        </div>
      </div>

      <div class="float" style="left:596px;top:296px;animation-delay:.90s">
        <div class="mini mini-card" style="width:168px;--own:var(--h-sec);background:color-mix(in srgb,var(--h-sec) 14%,var(--node-fill));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--h-sec) 40%,transparent),var(--lift-node)">
          <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;color:var(--h-sec);margin-bottom:5px">
            <svg width="11" height="11"><use href="#i-shield"/></svg>Sentry</div>
          <span style="font-size:11.5px;line-height:1.4">Ticket IDs are sequential. Use opaque public IDs.</span>
        </div>
      </div>

      <div class="cursor" id="hc1" style="left:286px;top:208px;color:var(--h-design)">
        <svg width="17" height="20" style="color:var(--h-design)"><use href="#i-cursor"/></svg>
        <span style="background:var(--h-design)">Maya · Design</span>
      </div>
      <div class="cursor" id="hc2" style="left:518px;top:428px;color:var(--h-arch)">
        <svg width="17" height="20" style="color:var(--h-arch)"><use href="#i-cursor"/></svg>
        <span style="background:var(--h-arch)">Atlas · Architecture</span>
      </div>
      <div class="cursor" id="hc3" style="left:186px;top:368px;color:var(--h-human-1)">
        <svg width="17" height="20" style="color:var(--h-human-1)"><use href="#i-cursor"/></svg>
        <span style="background:var(--h-human-1)">Avichal</span>
      </div>
    </div>
  </div>

  <div class="wrap hero-inner">
    <div class="command">
      <h1 class="display h-xl">Build with an AI team,<br>not an AI chat.</h1>
      <p class="lede">Guild is one infinite canvas holding your whole project — requirements, flows, wireframes, architecture, tasks. Humans and AI agents work on it at the same time, and you can see exactly where each of them is.</p>

      <label class="composer" for="hero-prompt">
        <svg width="17" height="17" style="color:var(--ink-3);flex:none"><use href="#i-bolt"/></svg>
        <input id="hero-prompt" placeholder="An AI support inbox for Shopify sellers…" aria-label="Describe what you're building">
        <button class="btn btn-sm btn-primary" data-go="canvas">Assemble team</button>
      </label>

      <div class="roster">
        <span class="tiny">Recommended</span>
        <span class="chip"><i class="dot" style="background:var(--h-product)"></i>Product</span>
        <span class="chip"><i class="dot" style="background:var(--h-design)"></i>Design</span>
        <span class="chip"><i class="dot" style="background:var(--h-arch)"></i>Architecture</span>
        <span class="chip"><i class="dot" style="background:var(--h-ai)"></i>AI systems</span>
        <span class="chip"><i class="dot" style="background:var(--h-sec)"></i>Security</span>
        <span class="chip"><i class="dot" style="background:var(--h-impl)"></i>Implementation</span>
      </div>
    </div>
  </div>

  <div class="wrap hero-foot">
      <span class="small"><i class="dot" style="background:var(--h-product)"></i>Live multiplayer, humans and agents</span>
      <span class="small"><i class="dot" style="background:var(--h-arch)"></i>Every agent action is reversible</span>
      <span class="small"><i class="dot" style="background:var(--h-ai)"></i>Open to Claude Code, Codex and WebMCP</span>
  </div>
</div>

<!-- modes -->
<div class="band" id="modes">
  <div class="wrap">
    <div class="band-head">
      <h2 class="display h-l">One board. Three ways to make things.</h2>
      <p class="lede">Modes change the tools in your hand, not the board underneath. A requirement, a screen and the task that ships it live a few hundred pixels apart, connected.</p>
    </div>

    <div class="modes">
      <div class="modelist" role="group" aria-label="Canvas modes">
        <button class="modebtn" aria-pressed="true" data-mode="diagram">
          <strong>Diagram</strong>
          Requirements, journeys, system and agent architecture, decisions.
        </button>
        <button class="modebtn" aria-pressed="false" data-mode="tasks">
          <strong>Tasks</strong>
          Implementation plans, bugs, reviews, testing and launch work.
        </button>
        <button class="modebtn" aria-pressed="false" data-mode="wireframe">
          <strong>Wireframe</strong>
          Screens and states, low fidelity and fast for agents to generate.
        </button>
      </div>

      <div class="stage">
        <div class="stage-grid"></div>

        <div class="stage-pane" data-mode="diagram" data-on="1">
          <svg style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="var(--wire)" stroke-width="1.4">
            <path d="M172 122 H240"/><path d="M172 268 C 212 268, 212 150, 240 150"/>
            <path d="M398 140 C 448 140, 448 96, 496 96"/><path d="M398 156 C 448 156, 448 216, 496 216"/>
            <path d="M616 124 C 664 124, 668 330, 372 330 C 300 330, 258 336, 236 342"/>
            <path d="M566 348 C 604 348, 606 342, 640 342" stroke-dasharray="4 4"/>
          </svg>
          <div class="n n-sticky s-amber" style="left:30px;top:74px;width:142px;height:124px">
            <b style="font-size:12px">Merchants drown in repeat questions</b>
            <div class="foot">problem<span class="prio">P0</span></div>
          </div>
          <div class="n n-sticky s-mint" style="left:30px;top:222px;width:142px;height:124px">
            <b style="font-size:12px">Answers must cite the real order</b>
            <div class="foot">requirement<span class="prio">P0</span></div>
          </div>
          <div class="n n-shape v-rectangle" style="left:240px;top:114px;width:158px;height:58px">
            <span class="semtag">service</span>Draft engine
          </div>
          <div class="n n-shape v-cylinder" style="left:496px;top:62px;width:126px;height:70px">tickets</div>
          <div class="n n-shape v-hexagon" style="left:496px;top:188px;width:150px;height:58px">embed queue</div>
          <div class="n n-shape v-diamond" style="left:170px;top:308px;width:150px;height:80px;font-size:11.5px">Confident?</div>
          <div class="n n-annot" style="left:356px;top:306px;width:210px;--own:var(--h-sec)">
            <div class="who"><svg width="11" height="11"><use href="#i-shield"/></svg>Security</div>
            Ticket IDs are sequential. Use opaque public IDs before launch.
          </div>
          <div class="n n-icon" style="left:690px;top:96px">
            <div class="box"><svg width="22" height="22" style="color:var(--h-arch)"><use href="#i-cloud"/></svg></div>
            <div class="cap">Shopify API</div>
          </div>
          <div class="n n-task" style="left:640px;top:298px;width:214px">
            <div class="tt">Opaque public ticket IDs</div>
            <div class="checks">
              <div class="ck done"><i><svg width="8" height="8" style="color:#fff"><use href="#i-check"/></svg></i>Accepted by Avichal</div>
              <div class="ck"><i></i>Migration written</div>
            </div>
            <div class="tfoot">
              <span class="tag" style="background:color-mix(in srgb,var(--h-sec) 20%,transparent);color:var(--h-sec)">P0</span>
              <span class="tag" style="background:color-mix(in srgb,var(--h-impl) 22%,transparent);color:var(--ink-2)">decision</span>
              <span class="avatar" style="background:var(--h-sec)">Se</span>
            </div>
          </div>
        </div>

        <div class="stage-pane" data-mode="tasks">
          <div class="n n-stack" style="left:34px;top:38px;width:194px">
            <div class="sh"><i class="dot" style="background:var(--ink-4)"></i><b>BACKLOG</b><span class="cnt">6</span></div>
            <div class="n n-task"><div class="tt">Opaque public ticket IDs</div>
              <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-sec) 18%,transparent);color:var(--h-sec)">P0</span>
              <span class="tag" style="background:var(--shade);color:var(--ink-3)">security</span></div></div>
            <div class="add">Add card</div>
          </div>
          <div class="n n-stack" style="left:250px;top:38px;width:194px">
            <div class="sh"><i class="dot" style="background:var(--h-arch)"></i><b>IN PROGRESS</b><span class="cnt">2</span></div>
            <div class="n n-task" data-by="1" style="--own:var(--h-impl)">
              <div class="tt">Draft-reply endpoint</div>
              <div class="checks">
                <div class="ck done"><i><svg width="8" height="8" style="color:#fff"><use href="#i-check"/></svg></i>Schema</div>
                <div class="ck"><i></i>Retrieval over order history</div>
                <div class="ck"><i></i>Streaming response</div>
              </div>
              <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-sec) 18%,transparent);color:var(--h-sec)">P0</span>
                <div class="avatar" style="background:var(--h-impl)">Cx</div></div>
            </div>
          </div>
          <div class="n n-stack" style="left:466px;top:38px;width:194px">
            <div class="sh"><i class="dot" style="background:var(--h-ai)"></i><b>REVIEW</b><span class="cnt">1</span></div>
            <div class="n n-task"><div class="tt">Confidence threshold before auto-send</div>
              <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-ai) 18%,transparent);color:var(--h-ai)">ai</span>
                <div class="avatar" style="background:var(--h-ai)">N</div></div></div>
            <div class="add">Add card</div>
          </div>
          <div class="n n-text" style="left:690px;top:52px;width:170px">
            <h5 style="font-size:15px">Sprint 1</h5>
            <p style="font-size:12px">Everything here traces back to a requirement on the board.</p>
          </div>

          <svg style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="var(--wire)" stroke-width="1.4">
            <path d="M184 316 C 234 316, 236 222, 262 216" stroke-dasharray="5 5"/>
            <path d="M563 286 V 246" stroke-dasharray="5 5"/>
          </svg>
          <div class="elabel" style="left:196px;top:262px">implements</div>
          <div class="n n-sticky s-mint" style="left:34px;top:282px;width:150px;height:104px">
            <b style="font-size:12px">Answers must cite the real order</b>
            <div class="foot">requirement<span class="prio">P0</span></div>
          </div>
          <div class="elabel" style="left:576px;top:250px;color:var(--h-sec)">blocks</div>
          <div class="n n-annot" style="left:466px;top:286px;width:194px;--own:var(--h-sec)">
            <div class="who"><svg width="11" height="11"><use href="#i-shield"/></svg>Sentry</div>
            Blocking review until PII is redacted from retrieval context.
          </div>
          <div class="ccursor" style="left:322px;top:296px;color:var(--h-impl)">
            <svg width="16" height="19"><use href="#i-cursor"/></svg>
            <div class="tagname" style="background:var(--h-impl)">Codex <em>writing</em></div>
          </div>
        </div>

        <div class="stage-pane" data-mode="wireframe">
          <div class="n n-wf" style="left:38px;top:54px;width:290px;height:196px">
            <span class="flbl">Inbox · desktop</span>
            <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">app.acme.support/inbox</div></div>
            <div class="screen" style="grid-template-columns:78px 1fr;gap:10px;height:calc(100% - 26px)">
              <div style="display:grid;gap:6px;align-content:start">
                <div class="wc-line" style="width:80%"></div>
                <div class="wc-rect" style="height:20px"></div>
                <div class="wc-rect" style="height:20px;background:var(--shade)"></div>
                <div class="wc-rect" style="height:20px"></div>
              </div>
              <div style="display:grid;gap:8px;align-content:start">
                <div class="wc-nav"><b>Ticket #4821</b><span>open</span></div>
                <div class="wc-card"><div class="wc-line" style="width:92%"></div><div class="wc-line" style="width:70%"></div></div>
                <div class="wc-textarea" style="height:38px">Suggested reply…</div>
                <div style="display:flex;gap:6px"><div class="wc-btn" style="flex:1">Send</div><div class="wc-btn ghost" style="flex:1">Edit draft</div></div>
              </div>
            </div>
          </div>
          <div class="n n-wf mobile" style="left:368px;top:34px;width:132px;height:236px">
            <span class="flbl">Merchant app</span>
            <div class="chrome"><span>9:41</span><span>▲ ▮</span></div>
            <div class="screen" style="height:calc(100% - 18px)">
              <div class="wc-line" style="width:56%;height:9px"></div>
              <div class="wc-card"><div class="wc-line" style="width:88%"></div><div class="wc-line" style="width:60%"></div></div>
              <div class="wc-card"><div class="wc-line" style="width:76%"></div><div class="wc-line" style="width:52%"></div></div>
              <div class="wc-btn" style="margin-top:auto">Open inbox</div>
            </div>
          </div>
          <div class="n n-annot" style="left:520px;top:78px;width:194px;--own:var(--h-design)">
            <div class="who"><i class="dot" style="background:var(--h-design)"></i>Design</div>
            Two primary actions compete here. Make “Edit draft” secondary.
          </div>
          <div class="n n-icon" style="left:540px;top:186px">
            <div class="box"><svg width="20" height="20" style="color:var(--ink-3)"><use href="#i-comment"/></svg></div>
            <div class="cap">3 open</div>
          </div>

          <svg style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="var(--wire)" stroke-width="1.4">
            <path d="M112 296 V 256" stroke-dasharray="5 5"/>
            <path d="M212 252 C 212 332, 330 336, 442 336"/>
          </svg>
          <div class="elabel" style="left:124px;top:262px;color:var(--h-design)">represented_by</div>
          <div class="n n-sticky s-mint" style="left:38px;top:296px;width:150px;height:104px">
            <b style="font-size:12px">Merchant can edit any draft before it sends</b>
            <div class="foot">requirement<span class="prio">P1</span></div>
          </div>
          <div class="elabel" style="left:312px;top:312px">uses</div>
          <div class="n n-shape v-rectangle" style="left:442px;top:296px;width:272px;height:104px;padding:0">
            <div style="width:100%;padding:11px 13px;text-align:left">
              <div class="tiny" style="margin-bottom:9px;letter-spacing:.06em;text-transform:uppercase;font-size:9.5px;color:var(--ink-4)">shared components</div>
              <div style="display:flex;gap:7px;flex-wrap:wrap">
                <div class="wc-btn" style="height:24px;font-size:9.5px;padding:0 11px">Send</div>
                <div class="wc-btn ghost" style="height:24px;font-size:9.5px;padding:0 11px">Edit draft</div>
                <div class="wc-textarea" style="height:24px;flex:1;min-width:96px;font-size:9.5px;display:flex;align-items:center">Reply…</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- team -->
<div class="band" id="team" style="padding-top:20px">
  <div class="wrap">
    <div class="band-head">
      <h2 class="display h-l">Give every teammate a job.</h2>
      <p class="lede">Agents aren't a sidebar. Each one holds a role, owns an area of the board, and answers to the same history and undo as everyone else.</p>
    </div>
    <div class="rail">
      <article class="agentcard glass">
        <span class="aura" style="background:radial-gradient(circle,var(--h-product),transparent 70%)"></span>
        <div class="agenthead"><div class="avatar" style="background:var(--h-product)">Pr</div>
          <div><h3>Vera</h3><div class="role">Product · GPT</div></div></div>
        <p class="small">Turns a loose idea into objectives, requirements and priorities the rest of the team can build against.</p>
        <ul><li>Owns Product requirements</li><li>Writes P0–P2 priorities</li><li>Rejects scope without a user</li></ul>
      </article>
      <article class="agentcard glass">
        <span class="aura" style="background:radial-gradient(circle,var(--h-design),transparent 70%)"></span>
        <div class="agenthead"><div class="avatar" style="background:var(--h-design)">Ma</div>
          <div><h3>Maya</h3><div class="role">Design · Claude</div></div></div>
        <p class="small">Draws user journeys and low-fidelity screens, then argues with them until the flow gets shorter.</p>
        <ul><li>Owns Design and Journeys</li><li>Builds wireframe frames</li><li>Flags competing CTAs</li></ul>
      </article>
      <article class="agentcard glass">
        <span class="aura" style="background:radial-gradient(circle,var(--h-arch),transparent 70%)"></span>
        <div class="agenthead"><div class="avatar" style="background:var(--h-arch)">At</div>
          <div><h3>Atlas</h3><div class="role">Architecture · Claude</div></div></div>
        <p class="small">Keeps services, data and API boundaries honest, and records why each choice was made.</p>
        <ul><li>Owns System architecture</li><li>Writes decision records</li><li>Names the bottleneck first</li></ul>
      </article>
      <article class="agentcard glass">
        <span class="aura" style="background:radial-gradient(circle,var(--h-ai),transparent 70%)"></span>
        <div class="agenthead"><div class="avatar" style="background:var(--h-ai)">No</div>
          <div><h3>Nova</h3><div class="role">AI systems · GPT</div></div></div>
        <p class="small">Designs the retrieval, orchestration and evaluation layer for anything model-shaped in the product.</p>
        <ul><li>Owns Agent architecture</li><li>Defines eval criteria</li><li>Budgets tokens and latency</li></ul>
      </article>
      <article class="agentcard glass">
        <span class="aura" style="background:radial-gradient(circle,var(--h-sec),transparent 70%)"></span>
        <div class="agenthead"><div class="avatar" style="background:var(--h-sec)">Se</div>
          <div><h3>Sentry</h3><div class="role">Security · Claude</div></div></div>
        <p class="small">Reads everything the others make and leaves comments instead of silently rewriting their work.</p>
        <ul><li>Reviews all areas</li><li>Comments, never overwrites</li><li>Blocks launch on P0 issues</li></ul>
      </article>
      <article class="agentcard glass">
        <span class="aura" style="background:radial-gradient(circle,var(--h-impl),transparent 70%)"></span>
        <div class="agenthead"><div class="avatar" style="background:var(--h-impl)">Cx</div>
          <div><h3>Codex</h3><div class="role">Implementation · joins over MCP</div></div></div>
        <p class="small">Claims implementation tasks from your editor, reads the same board, reports results back to the card.</p>
        <ul><li>Owns Implementation</li><li>Claims and closes tasks</li><li>Runs outside the browser</li></ul>
      </article>
    </div>
  </div>
</div>

<!-- traceability -->
<div class="band" id="trace">
  <div class="wrap split" style="gap:52px;grid-template-columns:minmax(280px,.85fr) minmax(340px,1.15fr)">
    <div>
      <h2 class="display h-l" style="margin-bottom:14px">Every object knows why it exists.</h2>
      <p class="lede" style="margin-bottom:22px">A connector is both the line you drew and the relationship the agents reason over. Change one thing and the board can tell you what it touches.</p>
      <div class="runcard">
        <div class="tiny" style="margin-bottom:9px">If multi-currency is cut</div>
        <div class="runrow"><span>Screens</span><span class="st num">3</span></div>
        <div class="runrow"><span>API endpoints</span><span class="st num">2</span></div>
        <div class="runrow"><span>Database fields</span><span class="st num">1</span></div>
        <div class="runrow"><span>Implementation tasks</span><span class="st num">4</span></div>
        <div class="runrow"><span>Tests</span><span class="st num">7</span></div>
      </div>
    </div>
    <div class="chain">
      <div class="link"><span class="rel">informs</span>
        <div class="linknode"><i class="dot" style="background:var(--h-product)"></i><b>Merchants can't answer 300 tickets a day</b><span class="tiny">problem</span></div></div>
      <div class="link"><span class="rel">implemented_by</span>
        <div class="linknode"><i class="dot" style="background:var(--h-product)"></i><b>Draft replies from order history</b><span class="tiny">requirement</span></div></div>
      <div class="link"><span class="rel">represented_by</span>
        <div class="linknode"><i class="dot" style="background:var(--h-design)"></i><b>Inbox · desktop</b><span class="tiny">screen</span></div></div>
      <div class="link"><span class="rel">supported_by</span>
        <div class="linknode"><i class="dot" style="background:var(--h-arch)"></i><b>POST /drafts</b><span class="tiny">api</span></div></div>
      <div class="link"><span class="rel">writes_to</span>
        <div class="linknode"><i class="dot" style="background:var(--h-arch)"></i><b>tickets</b><span class="tiny">database</span></div></div>
      <div class="link"><span class="rel">delivered_by</span>
        <div class="linknode"><i class="dot" style="background:var(--h-impl)"></i><b>Draft-reply endpoint</b><span class="tiny">task</span></div></div>
      <div class="link"><span class="rel">verified_by</span>
        <div class="linknode"><i class="dot" style="background:var(--h-sec)"></i><b>Reply cites a real order</b><span class="tiny">test</span></div></div>
    </div>
  </div>
</div>

<!-- reversible + connect -->
<div class="band" id="enter" style="padding-top:20px">
  <div class="wrap split">
    <article class="panelcard glass">
      <h3>Fast, visible, reversible</h3>
      <p style="margin-bottom:18px">Agents don't stop for permission on every edit. You watch the run happen and you can end it, or roll the whole thing back, without losing the edits you made alongside it.</p>
      <div class="runcard" style="margin-bottom:14px">
        <div class="runrow"><i class="dot" style="background:var(--h-design)"></i>Maya<span class="bar"><i style="width:82%;background:var(--h-design)"></i></span><span class="st">3 screens</span></div>
        <div class="runrow"><i class="dot" style="background:var(--h-arch)"></i>Atlas<span class="bar"><i style="width:100%;background:var(--h-arch)"></i></span><span class="st">done</span></div>
        <div class="runrow"><i class="dot" style="background:var(--h-ai)"></i>Nova<span class="bar"><i style="width:46%;background:var(--h-ai)"></i></span><span class="st">retrieval</span></div>
        <div class="runrow"><i class="dot" style="background:var(--h-impl)"></i>Codex<span class="bar"><i style="width:12%;background:var(--h-impl)"></i></span><span class="st">waiting</span></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-glass"><svg width="13" height="13"><use href="#i-stop"/></svg>Stop run</button>
        <button class="btn btn-sm btn-glass"><svg width="14" height="14"><use href="#i-undo"/></svg>Undo run</button>
        <button class="btn btn-sm btn-glass"><svg width="14" height="14"><use href="#i-history"/></svg>Restore version</button>
      </div>
    </article>

    <article class="panelcard glass">
      <h3>Your agents come to the board</h3>
      <p style="margin-bottom:18px">Guild speaks MCP in both directions. A browser agent picks up the page's tools; Claude Code and Codex sign in over OAuth and work the same board from your terminal.</p>
      <div class="runcard" style="padding:14px 16px">
        <div class="termline"><em>claude</em><b>/mcp add guild https://guild.app/mcp</b></div>
        <div class="termline"><em></em><span>opening browser for sign-in…</span></div>
        <div class="termline"><em></em><span>connected · scopes workspace:read workspace:write runs:execute</span></div>
        <div class="termline" style="padding-top:10px"><em>tool</em><b>list_implementation_tasks</b></div>
        <div class="termline"><em></em><span>4 open · claiming “Draft-reply endpoint”</span></div>
        <div class="termline"><em>tool</em><b>report_task_result</b></div>
        <div class="termline"><em></em><span>card moved to Review · comment added</span></div>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:14px">
        <span class="chip">Claude Code</span><span class="chip">Codex</span><span class="chip">WebMCP in the browser</span>
      </div>
    </article>
  </div>
</div>

<div class="band" style="padding-top:0">
  <div class="wrap">
    <div class="cta glass glass-2">
      <h2 class="display h-l">Bring the whole project into one room.</h2>
      <p class="lede">Start a board, describe what you're building, and watch a team form around it.</p>
      <div class="row">
        <button class="btn btn-primary" data-go="canvas">Open a board</button>
        <button class="btn btn-glass" data-go="nodes">See the node system</button>
      </div>
    </div>
    <footer>
      <div class="footgrid">
        <div>
          <a class="brand" href="#" data-go="landing" style="margin-bottom:10px">
            <svg class="prism" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l9.2 16.1a1.4 1.4 0 01-1.2 2.1H4a1.4 1.4 0 01-1.2-2.1z" fill="url(#pg)" opacity=".92"/></svg>
            Guild</a>
          <p class="small" style="max-width:34ch">The shared workspace where humans and AI agents build software together.</p>
        </div>
        <div><h4>Product</h4><a href="#modes">Canvas modes</a><a href="#team">AI team</a><a href="#trace">Traceability</a><a href="#" data-go="nodes">Node system</a></div>
        <div><h4>Connect</h4><a href="#enter">WebMCP</a><a href="#enter">Claude Code</a><a href="#enter">Codex</a><a href="#enter">Bring your own agent</a></div>
        <div><h4>Company</h4><a href="#">About</a><a href="#">Changelog</a><a href="#">Security</a><a href="#">Contact</a></div>
      </div>
    </footer>
  </div>
</div>
</section>
<!-- ═══════════════════════════════════════ WORKSPACES ══════ -->
<section class="view view-workspaces">
<div class="app">
  <aside class="rail-left glass glass-q" style="border-radius:0;border-right:1px solid var(--hairline-soft)">
    <a class="brand" href="#" data-go="landing">
      <svg class="prism" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l9.2 16.1a1.4 1.4 0 01-1.2 2.1H4a1.4 1.4 0 01-1.2-2.1z" fill="url(#pg)" opacity=".92"/></svg>
      Guild
    </a>
    <div class="navgroup">
      <button class="navitem" aria-current="page"><svg width="17" height="17"><use href="#i-board"/></svg>Boards<span class="k">⌘1</span></button>
      <button class="navitem" data-go="canvas"><svg width="17" height="17"><use href="#i-activity"/></svg>Activity</button>
      <button class="navitem"><svg width="17" height="17"><use href="#i-team"/></svg>AI team</button>
      <button class="navitem"><svg width="17" height="17"><use href="#i-template"/></svg>Templates</button>
      <button class="navitem" data-go="nodes"><svg width="17" height="17"><use href="#i-inspect"/></svg>Node system</button>
    </div>
    <div class="navgroup">
      <h4>Acme Support</h4>
      <button class="navitem"><i class="dot" style="background:var(--h-arch)"></i>Support inbox</button>
      <button class="navitem"><i class="dot" style="background:var(--h-product)"></i>Merchant onboarding</button>
      <button class="navitem"><i class="dot" style="background:var(--h-ai)"></i>Agent evals</button>
      <button class="navitem" style="color:var(--ink-4)"><svg width="15" height="15"><use href="#i-plus"/></svg>New board</button>
    </div>
    <div class="foot">
      <div class="avatar" style="background:var(--h-human-1)">Av</div>
      <div style="min-width:0">
        <div style="font-size:13px;font-weight:500">Avichal</div>
        <div class="tiny" style="overflow:hidden;text-overflow:ellipsis">Owner · Acme Support</div>
      </div>
      <button class="btn-icon" style="margin-left:auto;color:var(--ink-3)" aria-label="Settings"><svg width="16" height="16"><use href="#i-settings"/></svg></button>
    </div>
  </aside>

  <main class="canvas-page">
    <div class="wsbar">
      <label class="searchbox">
        <svg width="15" height="15" style="color:var(--ink-4)"><use href="#i-search"/></svg>
        <input placeholder="Search boards, objects, decisions" aria-label="Search">
      </label>
      <div style="flex:1"></div>
      <button class="themetoggle" id="theme-2" aria-label="Switch theme"><svg width="17" height="17"><use href="#i-sun"/></svg></button>
      <button class="btn btn-sm btn-glass">Invite people</button>
      <button class="btn btn-sm btn-primary" data-go="canvas"><svg width="14" height="14"><use href="#i-plus"/></svg>New board</button>
    </div>

    <section class="startcard glass">
      <span class="aura"></span>
      <h2>What are you building?</h2>
      <p class="small" style="max-width:52ch;margin-bottom:20px">Describe it in a sentence. Guild proposes a team, opens a board, and the agents start laying out requirements while you watch.</p>
      <label class="composer" style="max-width:660px">
        <svg width="17" height="17" style="color:var(--ink-3);flex:none"><use href="#i-bolt"/></svg>
        <input placeholder="A billing dashboard for usage-based pricing…" aria-label="Describe what you're building">
        <button class="btn btn-sm btn-primary" data-go="canvas">Assemble team</button>
      </label>
      <div class="roster" style="margin-top:18px">
        <span class="tiny">Or start from</span>
        <button class="chip">Build a SaaS</button>
        <button class="chip">Build an AI agent</button>
        <button class="chip">Build a mobile app</button>
        <button class="chip">Build an API</button>
        <button class="chip">Build an internal tool</button>
      </div>
    </section>

    <div class="sechead">
      <h3>Boards</h3><span class="tiny num">3 active</span>
      <button class="more">Sort: recently opened</button>
    </div>

    <div class="boards">
      <button class="board glass" data-go="canvas">
        <div class="thumb">
          <div class="g"></div>
          <svg style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="var(--wire-soft)" stroke-width="1.4">
            <path d="M84 42 H118"/><path d="M84 78 C 104 78, 104 48, 118 48"/><path d="M196 52 C 216 52, 216 92, 236 92"/>
          </svg>
          <div style="position:absolute;left:16px;top:26px;width:62px;height:38px;border-radius:3px;background:linear-gradient(170deg,#FFE9A8,#FFDD84);box-shadow:var(--lift-node)"></div>
          <div style="position:absolute;left:16px;top:70px;width:62px;height:32px;border-radius:3px;background:linear-gradient(170deg,#C8EFD8,#A8E3C2);box-shadow:var(--lift-node)"></div>
          <div style="position:absolute;left:118px;top:34px;width:78px;height:32px;border-radius:7px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--wire-soft)"></div>
          <div style="position:absolute;left:118px;top:80px;width:78px;height:28px;border-radius:99px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--wire-soft)"></div>
          <div style="position:absolute;left:236px;top:74px;width:46px;height:36px;border-radius:50%/12px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--wire-soft)"></div>
          <div class="cursor" style="left:150px;top:86px;position:absolute;transition:none">
            <svg width="14" height="17" style="color:var(--h-design)"><use href="#i-cursor"/></svg>
          </div>
        </div>
        <div class="board-body">
          <h4>Support inbox</h4>
          <div class="tiny">AI-native ticket triage for Shopify merchants</div>
          <div class="board-meta">
            <div class="stack-av">
              <div class="avatar" style="background:var(--h-human-1)">Av</div>
              <div class="avatar" style="background:var(--h-human-2);color:#4a3d22">Kr</div>
              <div class="avatar" style="background:var(--h-design)">Ma</div>
              <div class="avatar" style="background:var(--h-arch)">At</div>
              <div class="avatar" style="background:var(--h-impl)">Cx</div>
            </div>
            <span class="live" style="margin-left:auto;color:var(--h-product)"><i class="pulse" style="background:currentColor"></i>Run in progress</span>
          </div>
        </div>
      </button>

      <button class="board glass" data-go="canvas">
        <div class="thumb">
          <div class="g"></div>
          <div style="position:absolute;left:18px;top:22px;width:74px;height:92px;border-radius:8px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
          <div style="position:absolute;left:24px;top:36px;width:62px;height:24px;border-radius:6px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
          <div style="position:absolute;left:24px;top:66px;width:62px;height:24px;border-radius:6px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
          <div style="position:absolute;left:104px;top:22px;width:74px;height:92px;border-radius:8px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
          <div style="position:absolute;left:110px;top:36px;width:62px;height:24px;border-radius:6px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
          <div style="position:absolute;left:190px;top:22px;width:74px;height:92px;border-radius:8px;background:var(--glass-quiet);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
          <div style="position:absolute;left:196px;top:36px;width:62px;height:24px;border-radius:6px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
          <div style="position:absolute;left:196px;top:66px;width:62px;height:24px;border-radius:6px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--hairline-soft)"></div>
        </div>
        <div class="board-body">
          <h4>Merchant onboarding</h4>
          <div class="tiny">Two-step setup, Shopify OAuth, first-ticket moment</div>
          <div class="board-meta">
            <div class="stack-av">
              <div class="avatar" style="background:var(--h-human-2);color:#4a3d22">Kr</div>
              <div class="avatar" style="background:var(--h-product)">Pr</div>
            </div>
            <span class="tiny" style="margin-left:auto">Edited 2 hours ago</span>
          </div>
        </div>
      </button>

      <button class="board glass" data-go="canvas">
        <div class="thumb">
          <div class="g"></div>
          <svg style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="var(--wire-soft)" stroke-width="1.4">
            <path d="M148 46 C 148 66, 96 66, 96 84"/><path d="M148 46 C 148 66, 200 66, 200 84"/>
            <path d="M96 108 C 96 126, 148 126, 148 130"/><path d="M200 108 C 200 126, 148 126, 148 130"/>
          </svg>
          <div style="position:absolute;left:112px;top:26px;width:72px;height:24px;border-radius:99px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--wire-soft)"></div>
          <div style="position:absolute;left:60px;top:82px;width:72px;height:26px;border-radius:7px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--wire-soft)"></div>
          <div style="position:absolute;left:164px;top:82px;width:72px;height:26px;border-radius:7px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--wire-soft)"></div>
          <div style="position:absolute;left:112px;top:126px;width:72px;height:24px;border-radius:99px;background:var(--node-fill);box-shadow:inset 0 0 0 1px var(--wire-soft)"></div>
        </div>
        <div class="board-body">
          <h4>Agent evals</h4>
          <div class="tiny">Retrieval quality, hallucination checks, latency budget</div>
          <div class="board-meta">
            <div class="stack-av">
              <div class="avatar" style="background:var(--h-ai)">No</div>
              <div class="avatar" style="background:var(--h-sec)">Se</div>
            </div>
            <span class="tiny" style="margin-left:auto">Edited yesterday</span>
          </div>
        </div>
      </button>
    </div>

    <div class="sechead"><h3>Acme Support at a glance</h3><span class="tiny">Across all boards</span></div>
    <div class="overview">
      <section class="panelcard glass" style="padding:20px">
        <h3 style="font-size:15px;font-family:var(--f-ui);letter-spacing:-.01em;margin-bottom:6px">Progress by area</h3>
        <div class="progrow"><span style="width:88px">Product</span><span class="bar"><i style="width:80%;background:var(--h-product)"></i></span><span class="pct num">80%</span></div>
        <div class="progrow"><span style="width:88px">Design</span><span class="bar"><i style="width:60%;background:var(--h-design)"></i></span><span class="pct num">60%</span></div>
        <div class="progrow"><span style="width:88px">Architecture</span><span class="bar"><i style="width:100%;background:var(--h-arch)"></i></span><span class="pct num">100%</span></div>
        <div class="progrow"><span style="width:88px">Backend</span><span class="bar"><i style="width:40%;background:var(--h-impl)"></i></span><span class="pct num">40%</span></div>
        <div class="progrow"><span style="width:88px">Security</span><span class="bar"><i style="width:20%;background:var(--h-sec)"></i></span><span class="pct num">20%</span></div>
      </section>

      <section class="panelcard glass" style="padding:20px">
        <h3 style="font-size:15px;font-family:var(--f-ui);letter-spacing:-.01em;margin-bottom:6px">Needs you</h3>
        <div class="attn"><i class="dot" style="background:var(--h-arch);margin-top:6px"></i>
          <div><b style="font-weight:500">3 decisions waiting for approval</b><span class="tiny">Atlas proposed swapping the queue for Convex workflows</span></div></div>
        <div class="attn"><i class="dot" style="background:var(--h-sec);margin-top:6px"></i>
          <div><b style="font-weight:500">2 architecture concerns</b><span class="tiny">Sentry flagged sequential ticket IDs and an unbounded retry</span></div></div>
        <div class="attn"><i class="dot" style="background:var(--h-impl);margin-top:6px"></i>
          <div><b style="font-weight:500">7 implementation tasks remaining</b><span class="tiny">4 unclaimed in Sprint 1</span></div></div>
        <div class="attn"><i class="dot" style="background:var(--ink-4);margin-top:6px"></i>
          <div><b style="font-weight:500">Codex is blocked</b><span class="tiny">Waiting on the draft-reply contract to be approved</span></div></div>
      </section>

      <section class="panelcard glass" style="padding:20px">
        <h3 style="font-size:15px;font-family:var(--f-ui);letter-spacing:-.01em;margin-bottom:10px">Your AI team</h3>
        <button class="teamrow"><div class="avatar" style="background:var(--h-product)">Pr</div>
          <div><span class="nm">Vera</span><span class="r">Product · GPT</span></div><span class="state working">Working</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-design)">Ma</div>
          <div><span class="nm">Maya</span><span class="r">Design · Claude</span></div><span class="state working">Working</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-arch)">At</div>
          <div><span class="nm">Atlas</span><span class="r">Architecture · Claude</span></div><span class="state idle">Idle</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-ai)">No</div>
          <div><span class="nm">Nova</span><span class="r">AI systems · GPT</span></div><span class="state working">Working</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-impl)">Cx</div>
          <div><span class="nm">Codex</span><span class="r">Implementation · MCP</span></div><span class="state blocked">Blocked</span></button>
        <button class="teamrow" style="color:var(--ink-4)">
          <div class="avatar" style="background:var(--shade);color:var(--ink-3);box-shadow:inset 0 0 0 1px var(--hairline)"><svg width="13" height="13"><use href="#i-plus"/></svg></div>
          <div><span class="nm" style="color:var(--ink-3)">Add a teammate</span><span class="r">Claude, GPT, Gemini or your own</span></div></button>
      </section>
    </div>
  </main>
</div>
</section>
<!-- ══════════════════════════════════════════ CANVAS ═══════ -->
<section class="view view-canvas">
<div class="canvasview">

  <div id="viewport">
    <div class="dots"></div>
    <div id="world">
      <svg id="wires" viewBox="0 0 3480 1560" width="3480" height="1560">
        <defs>
          <marker id="ar" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1.2 L9 5 L0 8.8 z" fill="var(--wire)"/>
          </marker>
          <marker id="ar-d" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1.2 L9 5 L0 8.8 z" fill="var(--h-design)"/>
          </marker>
          <marker id="dotend" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5">
            <circle cx="4" cy="4" r="3" fill="var(--wire)"/>
          </marker>
        </defs>

        <g fill="none" stroke="var(--wire)" stroke-width="1.8" marker-end="url(#ar)">
          <!-- requirements -->
          <path d="M250 256 H282"/>
          <!-- requirement → screen (traceability, dashed = semantic only) -->
          <path d="M352 300 C 352 470, 620 560, 906 690" stroke="var(--h-design)" stroke-dasharray="6 5" marker-end="url(#ar-d)"/>
          <!-- requirement → task -->
          <path d="M200 300 C 200 640, 280 700, 330 862" stroke-dasharray="6 5"/>
          <!-- journey -->
          <path d="M1078 286 C 1090 286, 1084 200, 1096 200"/>
          <path d="M1078 286 H1096"/>
          <path d="M1078 286 C 1090 286, 1084 372, 1096 372"/>
          <path d="M1258 286 C 1290 286, 1288 240, 1312 240"/>
          <path d="M1258 286 C 1290 286, 1288 330, 1312 330"/>
          <path d="M1470 240 C 1500 240, 1500 278, 1524 278"/>
          <path d="M1470 330 C 1500 330, 1500 292, 1524 292"/>
          <!-- screen → api -->
          <path d="M1338 780 C 1620 780, 1700 300, 2206 258" stroke-dasharray="6 5"/>
          <!-- architecture -->
          <path d="M1980 262 H2006"/>
          <path d="M2178 258 H2206"/>
          <path d="M2360 250 C 2390 250, 2392 182, 2412 182"/>
          <path d="M2500 214 V 244"/>
          <path d="M2500 310 V 340"/>
          <path d="M2584 182 C 2620 182, 2640 440, 2600 486"/>
          <!-- agent architecture -->
          <path d="M2044 926 H2068"/>
          <path d="M2220 900 C 2244 900, 2246 890, 2266 890"/>
          <path d="M2220 952 C 2244 952, 2246 976, 2266 976"/>
          <path d="M2438 890 C 2464 890, 2472 918, 2488 922"/>
          <path d="M2438 976 C 2464 976, 2472 946, 2488 942"/>
          <path d="M2580 926 H2618"/>
        </g>
      </svg>

      <!-- ── connector labels ─────────────────────────────── -->
      <div class="elabel" style="left:686px;top:566px;color:var(--h-design)">represented_by</div>
      <div class="elabel" style="left:196px;top:722px">delivered_by</div>
      <div class="elabel" style="left:1712px;top:520px">supported_by</div>
      <div class="elabel" style="left:2540px;top:326px">writes_to</div>
      <div class="elabel" style="left:2546px;top:230px">emits</div>
      <div class="elabel" style="left:2192px;top:214px">calls</div>
      <div class="elabel" style="left:2660px;top:360px">reads_from</div>

      <!-- ── board title (TEXT node) ──────────────────────── -->
      <div class="n n-text" style="left:60px;top:8px;width:700px">
        <span class="lbl">text</span>
        <h5 style="font-size:24px">Acme Support — concept to implementation</h5>
        <p>Six areas, one project. Everything traces back to the problem on the left.</p>
      </div>

      <!-- ══ SECTION A1: PRODUCT REQUIREMENTS ══ -->
      <div class="n n-section" style="left:60px;top:120px;width:780px;height:620px;--own:var(--h-product)">
        <span class="glow"></span>
        <div class="hd"><i class="dot" style="background:var(--h-product)"></i><b>PRODUCT REQUIREMENTS</b><span class="cnt num">9 objects</span>
          <div class="avatar" style="width:18px;height:18px;font-size:8px;background:var(--h-product);box-shadow:none">Pr</div></div>
      </div>

      <!-- freehand DRAWING circling a requirement -->
      <div class="n n-draw" style="left:264px;top:160px;width:202px;height:190px">
        <span class="lbl">drawing</span>
        <svg viewBox="0 0 202 190" width="202" height="190">
          <path d="M28 44 C 60 14, 152 18, 176 58 C 196 96, 168 148, 110 158 C 52 168, 8 138, 10 96 C 12 66, 26 50, 40 42"
                stroke="var(--h-human-1)" stroke-width="2.6" opacity=".85"/>
        </svg>
      </div>

      <div class="n n-sticky s-amber" style="left:92px;top:190px;width:158px;height:126px">
        <span class="lbl">sticky · problem</span>
        <b style="font-size:12.5px;line-height:1.35">Merchants drown in repeat “where is my order” tickets</b>
        <div class="foot">problem<span class="prio">P0</span></div>
      </div>

      <div class="n n-sticky s-mint leased" style="left:282px;top:190px;width:158px;height:126px;--own:var(--h-human-2)">
        <span class="lbl">sticky · requirement</span>
        <b style="font-size:12.5px;line-height:1.35">Every reply must cite the real order</b>
        <div class="foot">requirement<span class="prio">P0</span></div>
      </div>
      <div class="pin" style="left:424px;top:178px;background:var(--h-sec)">2</div>

      <div class="n n-sticky s-lilac" style="left:470px;top:190px;width:158px;height:126px;--own:var(--h-human-2)" data-sel="Krish">
        <span class="lbl">sticky · requirement</span>
        <b style="font-size:12.5px;line-height:1.35">Anything about refunds escalates to a human</b>
        <div class="foot">requirement<span class="prio">P1</span></div>
      </div>

      <div class="n n-sticky s-lilac" style="left:658px;top:190px;width:158px;height:126px;--own:var(--h-product)" data-by="1">
        <span class="lbl">sticky · requirement · by Vera</span>
        <b style="font-size:12.5px;line-height:1.35">Merchant can edit any draft before it sends</b>
        <div class="foot">requirement<span class="prio">P0</span></div>
      </div>

      <!-- TABLE -->
      <div class="n n-table" style="left:92px;top:356px;width:336px">
        <span class="lbl">table</span>
        <div class="cap"><svg width="13" height="13" style="color:var(--ink-3)"><use href="#i-table"/></svg>Release scope</div>
        <table>
          <thead><tr><th>Requirement</th><th>Priority</th><th>Owner</th></tr></thead>
          <tbody>
            <tr><td>Cite the real order</td><td><span class="k">P0</span></td><td>Vera</td></tr>
            <tr><td>Edit before send</td><td><span class="k">P0</span></td><td>Maya</td></tr>
            <tr><td>Escalate refunds</td><td><span class="k">P1</span></td><td>Vera</td></tr>
            <tr><td>Multi-language</td><td><span class="k">P2</span></td><td>—</td></tr>
          </tbody>
        </table>
      </div>

      <div class="n n-text" style="left:470px;top:358px;width:326px">
        <span class="lbl">text</span>
        <h5>Objective</h5>
        <p>Cut first response from six hours to under two minutes without ever sending a wrong answer. Success is measured on merchant edits per sent reply, not on volume.</p>
      </div>

      <div class="n n-annot" style="left:470px;top:500px;width:326px;--own:var(--h-sec)">
        <span class="lbl">annotation</span>
        <div class="who"><svg width="11" height="11"><use href="#i-shield"/></svg>Sentry · Security</div>
        “Escalates to a human” needs a definition of human availability, or refunds queue silently overnight.
      </div>

      <div class="n n-icon" style="left:92px;top:580px">
        <span class="lbl">icon</span>
        <div class="box"><svg width="22" height="22" style="color:var(--h-product)"><use href="#i-bolt"/></svg></div>
        <div class="cap">North star</div>
      </div>
      <div class="n n-icon" style="left:186px;top:580px">
        <div class="box"><svg width="22" height="22" style="color:var(--ink-3)"><use href="#i-comment"/></svg></div>
        <div class="cap">Interviews</div>
      </div>

      <!-- ══ SECTION A2: IMPLEMENTATION ══ -->
      <div class="n n-section" style="left:60px;top:820px;width:780px;height:600px;--own:var(--h-impl)">
        <span class="glow"></span>
        <div class="hd"><i class="dot" style="background:var(--h-impl)"></i><b>IMPLEMENTATION</b><span class="cnt num">3 stacks · 11 cards</span>
          <div class="avatar" style="width:18px;height:18px;font-size:8px;background:var(--h-impl);box-shadow:none">Cx</div></div>
      </div>

      <div class="n n-stack" style="left:92px;top:872px;width:210px">
        <span class="lbl">stack</span>
        <div class="sh"><i class="dot" style="background:var(--ink-4)"></i><b>BACKLOG</b><span class="cnt num">4</span></div>
        <div class="n n-task"><div class="tt">Opaque public ticket IDs</div>
          <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-sec) 18%,transparent);color:var(--h-sec)">P0</span>
            <span class="tag" style="background:var(--shade);color:var(--ink-3)">security</span></div></div>
        <div class="n n-task"><div class="tt">Escalation rota + on-call window</div>
          <div class="tfoot"><span class="tag" style="background:var(--shade);color:var(--ink-3)">P1</span></div></div>
        <div class="n n-task"><div class="tt">Multi-language reply drafts</div>
          <div class="tfoot"><span class="tag" style="background:var(--shade);color:var(--ink-3)">P2</span></div></div>
        <div class="add">Add card</div>
      </div>

      <div class="n n-stack" style="left:326px;top:872px;width:210px">
        <div class="sh"><i class="dot" style="background:var(--h-arch)"></i><b>IN PROGRESS</b><span class="cnt num">2</span></div>
        <div class="n n-task" data-by="1" style="--own:var(--h-impl)">
          <span class="lbl">task · claimed by Codex over MCP</span>
          <div class="tt">Draft-reply endpoint</div>
          <div class="checks">
            <div class="ck done"><i><svg width="8" height="8" style="color:#fff"><use href="#i-check"/></svg></i>Schema</div>
            <div class="ck done"><i><svg width="8" height="8" style="color:#fff"><use href="#i-check"/></svg></i>Order retrieval</div>
            <div class="ck"><i></i>Streaming response</div>
            <div class="ck"><i></i>Confidence score</div>
          </div>
          <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-sec) 18%,transparent);color:var(--h-sec)">P0</span>
            <span class="tag" style="background:var(--shade);color:var(--ink-3)">backend</span>
            <div class="avatar" style="background:var(--h-impl)">Cx</div></div>
        </div>
        <div class="n n-task"><div class="tt">Inbox list virtualisation</div>
          <div class="tfoot"><span class="tag" style="background:var(--shade);color:var(--ink-3)">P1</span>
            <div class="avatar" style="background:var(--h-human-2);color:#4a3d22">Kr</div></div></div>
      </div>

      <div class="n n-stack" style="left:560px;top:872px;width:210px">
        <div class="sh"><i class="dot" style="background:var(--h-ai)"></i><b>REVIEW</b><span class="cnt num">2</span></div>
        <div class="n n-task"><div class="tt">Confidence threshold before auto-send</div>
          <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-ai) 18%,transparent);color:var(--h-ai)">ai</span>
            <div class="avatar" style="background:var(--h-ai)">No</div></div></div>
        <div class="n n-task"><div class="tt">Redact PII from retrieval context</div>
          <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-sec) 18%,transparent);color:var(--h-sec)">P0</span>
            <div class="avatar" style="background:var(--h-sec)">Se</div></div></div>
        <div class="add">Add card</div>
      </div>
      <div class="pin" style="left:756px;top:906px;background:var(--h-arch)">1</div>

      <div class="n n-link" style="left:92px;top:1268px;width:300px">
        <span class="lbl">link</span>
        <div class="fav" style="background:#1C1B19">GH</div>
        <div style="min-width:0px"><b>acme/support-api · PR #219</b><span class="u">github.com/acme/support-api/pull/219</span></div>
      </div>

      <div class="n n-annot" style="left:420px;top:1268px;width:350px;--own:var(--h-impl)">
        <div class="who"><i class="dot" style="background:var(--h-impl)"></i>Codex · Implementation</div>
        Endpoint is behind a flag. I can't close this card until the confidence contract in AI architecture is approved.
      </div>

      <!-- ══ SECTION B1: USER JOURNEY ══ -->
      <div class="n n-section" style="left:880px;top:120px;width:920px;height:400px;--own:var(--h-design)">
        <span class="glow"></span>
        <div class="hd"><i class="dot" style="background:var(--h-design)"></i><b>USER JOURNEY</b><span class="cnt num">9 objects</span>
          <div class="avatar" style="width:18px;height:18px;font-size:8px;background:var(--h-design);box-shadow:none">Ma</div></div>
      </div>

      <div class="n n-mind root" style="left:908px;top:262px">
        <span class="lbl">mindMapNode · root</span>
        Support inbox
      </div>
      <div class="n n-mind" style="left:1096px;top:180px">Ticket arrives<span class="cnt num">3</span></div>
      <div class="n n-mind" style="left:1096px;top:266px">Draft generated<span class="cnt num">2</span></div>
      <div class="n n-mind" style="left:1096px;top:352px">Merchant reviews</div>
      <div class="n n-mind" style="left:1312px;top:220px">Retrieve order</div>
      <div class="n n-mind" style="left:1312px;top:310px">Score confidence</div>
      <div class="n n-shape v-diamond" style="left:1524px;top:238px;width:170px;height:96px;font-size:11.5px">
        <span class="lbl">shape · diamond · decision</span>
        Above 0.8?
      </div>
      <div class="n n-annot" style="left:1524px;top:368px;width:200px;--own:var(--h-design)">
        <div class="who"><i class="dot" style="background:var(--h-design)"></i>Maya · Design</div>
        Merchants told us they want to see the source order before they trust a draft.
      </div>

      <!-- ══ SECTION B2: DESIGN ══ -->
      <div class="n n-section" style="left:880px;top:560px;width:920px;height:860px;--own:var(--h-design)">
        <span class="glow"></span>
        <div class="hd"><i class="dot" style="background:var(--h-design)"></i><b>DESIGN · SCREENS</b><span class="cnt num">3 frames</span>
          <div class="avatar" style="width:18px;height:18px;font-size:8px;background:var(--h-design);box-shadow:none">Ma</div></div>
      </div>

      <!-- WIREFRAME FRAME · browser -->
      <div class="n n-wf" style="left:906px;top:640px;width:432px;height:300px;--own:var(--h-design)" data-by="1">
        <span class="flbl"><svg width="12" height="12"><use href="#i-frame"/></svg>Inbox · desktop</span>
        <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">app.acme.support/inbox/4821</div></div>
        <div class="screen" style="grid-template-columns:112px 1fr;gap:14px;height:calc(100% - 26px)">
          <div style="display:grid;gap:7px;align-content:start">
            <div class="wc-input" style="height:24px;font-size:9px">Search</div>
            <div class="wc-card" style="padding:7px;background:var(--shade)"><div class="wc-line" style="width:80%"></div><div class="wc-line" style="width:55%"></div></div>
            <div class="wc-card" style="padding:7px"><div class="wc-line" style="width:70%"></div><div class="wc-line" style="width:48%"></div></div>
            <div class="wc-card" style="padding:7px"><div class="wc-line" style="width:86%"></div><div class="wc-line" style="width:60%"></div></div>
          </div>
          <div style="display:grid;gap:9px;align-content:start;min-width:0px">
            <div class="wc-nav"><div class="wc-avatar" style="width:20px;height:20px"></div><b>Ticket #4821</b><span>open · 2h</span></div>
            <div class="wc-card"><div class="wc-line" style="width:94%"></div><div class="wc-line" style="width:76%"></div></div>
            <div class="wc-tabs"><span class="on">Draft</span><span>Order</span><span>History</span></div>
            <div class="wc-textarea" style="height:52px">Hi Ana — order #10422 shipped Tuesday and is out for delivery today…</div>
            <div style="display:flex;gap:7px"><div class="wc-btn" style="flex:1">Send reply</div><div class="wc-btn ghost" style="flex:1">Edit draft</div></div>
          </div>
        </div>
      </div>
      <div class="pin" style="left:1322px;top:628px;background:var(--h-design)">3</div>

      <!-- WIREFRAME FRAME · mobile -->
      <div class="n n-wf mobile" style="left:1382px;top:620px;width:196px;height:360px">
        <span class="flbl"><svg width="12" height="12"><use href="#i-frame"/></svg>Merchant app</span>
        <div class="chrome"><span>9:41</span><span>▲ ▮ ▮</span></div>
        <div class="screen" style="height:calc(100% - 18px);gap:10px">
          <div class="wc-nav"><b>Inbox</b><span style="margin-left:auto">3 new</span></div>
          <div class="wc-card"><div class="wc-line" style="width:88%"></div><div class="wc-line" style="width:62%"></div>
            <div class="wc-check"><i></i>Draft ready</div></div>
          <div class="wc-card"><div class="wc-line" style="width:76%"></div><div class="wc-line" style="width:54%"></div></div>
          <div class="wc-card"><div class="wc-line" style="width:82%"></div><div class="wc-line" style="width:48%"></div></div>
          <div class="wc-btn" style="margin-top:auto">Review drafts</div>
        </div>
      </div>

      <!-- WIREFRAME FRAME · empty state -->
      <div class="n n-wf" style="left:906px;top:1000px;width:432px;height:230px">
        <span class="flbl"><svg width="12" height="12"><use href="#i-frame"/></svg>Inbox · nothing waiting</span>
        <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">app.acme.support/inbox</div></div>
        <div class="screen" style="height:calc(100% - 26px);place-content:center;justify-items:center;text-align:center;gap:11px">
          <div class="wc-circle" style="width:38px;height:38px"></div>
          <div style="font-size:11px;font-weight:600">You're caught up</div>
          <div style="font-size:10px;color:var(--ink-3);max-width:26ch">New tickets arrive here with a draft already written. Nothing sends without you.</div>
          <div class="wc-btn ghost" style="padding:0 14px">Change escalation rules</div>
        </div>
      </div>

      <!-- standalone WIREFRAME COMPONENT (shared) -->
      <div class="n" style="left:1382px;top:1010px;width:196px">
        <span class="lbl">wireframeComponent · menu</span>
        <div class="wc wc-menu">
          <span class="on">Reply with draft</span>
          <span>Edit and send</span>
          <span>Escalate to a person</span>
          <span>Snooze 24h</span>
        </div>
      </div>

      <!-- IMAGE -->
      <div class="n n-image" style="left:1382px;top:1160px;width:196px;height:130px">
        <span class="lbl">image</span>
        <div class="ph"><svg width="20" height="20"><use href="#i-image"/></svg>merchant-inbox-ref.png</div>
      </div>

      <div class="n n-annot" style="left:1618px;top:640px;width:160px;--own:var(--h-sec)">
        <div class="who"><svg width="11" height="11"><use href="#i-shield"/></svg>Sentry</div>
        Draft body renders merchant HTML. Sanitise before preview.
      </div>

      <!-- ══ SECTION C1: SYSTEM ARCHITECTURE ══ -->
      <div class="n n-section" style="left:1860px;top:120px;width:960px;height:640px;--own:var(--h-arch)">
        <span class="glow"></span>
        <div class="hd"><i class="dot" style="background:var(--h-arch)"></i><b>SYSTEM ARCHITECTURE</b><span class="cnt num">12 objects</span>
          <div class="avatar" style="width:18px;height:18px;font-size:8px;background:var(--h-arch);box-shadow:none">At</div></div>
      </div>

      <div class="n n-shape v-actor" style="left:1892px;top:206px;width:88px;height:112px">
        <span class="lbl">shape · actor</span>
        <svg width="34" height="46" viewBox="0 0 34 46" fill="none" stroke="var(--wire)" stroke-width="2" stroke-linecap="round">
          <circle cx="17" cy="9" r="7"/><path d="M17 17v15M6 23h22M17 32l-8 12M17 32l8 12"/>
        </svg>
        <span style="font-size:11.5px">Merchant</span>
      </div>

      <div class="n n-shape v-rectangle" style="left:2006px;top:232px;width:172px;height:60px">
        <span class="lbl">shape · rectangle</span>
        <span class="semtag">client</span>
        <div class="shape-ic"><svg width="15" height="15"><use href="#i-board"/></svg>Inbox web app</div>
      </div>

      <div class="n n-shape v-pill" style="left:2206px;top:230px;width:156px;height:56px">
        <span class="lbl">shape · pill</span>
        <span class="semtag">api</span>
        API gateway
      </div>

      <div class="n n-shape v-rectangle" style="left:2412px;top:152px;width:176px;height:60px;--own:var(--h-arch)" data-by="1">
        <span class="lbl">shape · rectangle · by Atlas</span>
        <span class="semtag">service</span>
        <div class="shape-ic"><svg width="15" height="15"><use href="#i-bolt"/></svg>Draft engine</div>
      </div>

      <div class="n n-shape v-hexagon" style="left:2412px;top:244px;width:176px;height:66px">
        <span class="lbl">shape · hexagon</span>
        <span style="font-size:11.5px">Embed queue</span>
      </div>

      <div class="n n-shape v-cylinder" style="left:2426px;top:340px;width:148px;height:78px">
        <span class="lbl">shape · cylinder</span>
        <span class="semtag">database</span>
        <span style="padding-top:12px;font-size:12px">tickets</span>
      </div>

      <div class="n n-shape v-cloud" style="left:2412px;top:452px;width:176px;height:96px">
        <span class="lbl">shape · cloud</span>
        <svg viewBox="0 0 176 96" width="176" height="96" style="position:absolute;inset:0">
          <path d="M46 78 A22 22 0 0142 36 A31 31 0 0198 26 A26 26 0 01138 46 A17 17 0 01136 78 Z"
                fill="var(--node-fill)" stroke="var(--wire-soft)" stroke-width="1.4"/>
        </svg>
        <span style="position:relative;font-size:11.5px;padding-top:8px">Shopify API</span>
      </div>

      <div class="n n-table" style="left:1890px;top:392px;width:430px">
        <div class="cap"><svg width="13" height="13" style="color:var(--ink-3)"><use href="#i-table"/></svg>Draft API surface</div>
        <table>
          <thead><tr><th>Route</th><th>Method</th><th>Writes</th></tr></thead>
          <tbody>
            <tr><td class="k">/drafts</td><td>POST</td><td>tickets, drafts</td></tr>
            <tr><td class="k">/drafts/:id/send</td><td>POST</td><td>tickets</td></tr>
            <tr><td class="k">/tickets</td><td>GET</td><td>—</td></tr>
            <tr><td class="k">/escalations</td><td>POST</td><td>escalations</td></tr>
          </tbody>
        </table>
      </div>

      <div class="n n-annot" style="left:2620px;top:340px;width:178px;--own:var(--h-arch)">
        <div class="who"><i class="dot" style="background:var(--h-arch)"></i>Atlas · Architecture</div>
        Queue stays in-process until we pass 50 drafts/min. Revisit at launch.
      </div>

      <div class="n n-icon" style="left:1892px;top:610px">
        <div class="box"><svg width="22" height="22" style="color:var(--h-arch)"><use href="#i-db"/></svg></div>
        <div class="cap">Postgres</div>
      </div>
      <div class="n n-icon" style="left:1988px;top:610px">
        <div class="box"><svg width="22" height="22" style="color:var(--h-product)"><use href="#i-cloud"/></svg></div>
        <div class="cap">Convex</div>
      </div>
      <div class="n n-icon" style="left:2084px;top:610px">
        <div class="box"><svg width="22" height="22" style="color:var(--h-sec)"><use href="#i-shield"/></svg></div>
        <div class="cap">WorkOS</div>
      </div>

      <div class="n n-shape v-bracket" style="left:2210px;top:600px;width:230px;height:76px;font-size:11.5px">
        <span class="lbl">shape · bracket</span>
        Everything inside one Convex deployment for now
      </div>

      <!-- ══ SECTION C2: AI / AGENT ARCHITECTURE ══ -->
      <div class="n n-section" style="left:1860px;top:820px;width:960px;height:600px;--own:var(--h-ai)">
        <span class="glow"></span>
        <div class="hd"><i class="dot" style="background:var(--h-ai)"></i><b>AI / AGENT ARCHITECTURE</b><span class="cnt num">10 objects</span>
          <div class="avatar" style="width:18px;height:18px;font-size:8px;background:var(--h-ai);box-shadow:none">No</div></div>
      </div>

      <div class="n n-shape v-pill" style="left:1892px;top:900px;width:152px;height:52px;font-size:12px">Ticket text</div>
      <div class="n n-shape v-diamond" style="left:2068px;top:882px;width:152px;height:88px;font-size:11.5px">Route</div>
      <div class="n n-shape v-rectangle" style="left:2266px;top:862px;width:172px;height:56px">
        <span class="semtag">agent</span>
        <div class="shape-ic"><svg width="14" height="14"><use href="#i-search"/></svg>Retrieval</div>
      </div>
      <div class="n n-shape v-rectangle" style="left:2266px;top:948px;width:172px;height:56px">
        <span class="semtag">agent</span>
        <div class="shape-ic"><svg width="14" height="14"><use href="#i-bolt"/></svg>Reasoning</div>
      </div>
      <div class="n n-shape v-circle" style="left:2488px;top:880px;width:92px;height:92px;font-size:11.5px">Merge</div>
      <div class="n n-shape v-pill" style="left:2618px;top:900px;width:152px;height:52px;font-size:12px">Reply draft</div>

      <div class="n n-shape v-star" style="left:1892px;top:1010px;width:84px;height:84px;font-size:10px">
        <span class="lbl">shape · star</span>
        eval gate
      </div>
      <div class="n n-shape v-parallelogram" style="left:2000px;top:1016px;width:190px;height:66px;font-size:11.5px">
        <span class="lbl">shape · parallelogram</span>
        Redacted context
      </div>
      <div class="n n-shape v-trapezoid" style="left:2216px;top:1016px;width:170px;height:66px;font-size:11.5px">
        <span class="lbl">shape · trapezoid</span>
        Token budget
      </div>
      <div class="n n-shape v-triangle" style="left:2412px;top:1010px;width:96px;height:76px;font-size:10.5px">
        <span class="lbl">shape · triangle</span>
        Escalate
      </div>

      <div class="n n-text" style="left:1892px;top:1140px;width:400px">
        <h5>Why two agents, not one prompt</h5>
        <p>Retrieval is cheap and cacheable; reasoning is not. Splitting them lets us fail retrieval loudly instead of letting the model invent an order number.</p>
      </div>

      <div class="n n-annot" style="left:2340px;top:1150px;width:270px;--own:var(--h-ai)">
        <div class="who"><i class="dot" style="background:var(--h-ai)"></i>Nova · AI systems</div>
        Latency budget is 1.8s p95. Retrieval gets 400ms; anything slower falls back to “we're looking into it”.
      </div>

      <!-- ══ loose group: DECISIONS ══ -->
      <div class="n n-text" style="left:2880px;top:150px;width:420px">
        <h5>Decision log</h5>
        <p>Kept on the board so the next teammate — human or model — doesn't reopen a settled argument.</p>
      </div>

      <div class="n n-table" style="left:2880px;top:250px;width:430px">
        <div class="cap"><svg width="13" height="13" style="color:var(--ink-3)"><use href="#i-history"/></svg>Decisions</div>
        <table>
          <thead><tr><th>Decision</th><th>Proposed by</th><th>State</th></tr></thead>
          <tbody>
            <tr><td>Convex over a queue service</td><td>Atlas</td><td>Approved</td></tr>
            <tr><td>Monolith, not microservices</td><td>Vera</td><td>Approved</td></tr>
            <tr><td>Auto-send above 0.8</td><td>Nova</td><td>Waiting</td></tr>
            <tr><td>Opaque ticket IDs</td><td>Sentry</td><td>Waiting</td></tr>
          </tbody>
        </table>
      </div>

      <div class="n n-sticky s-rose" style="left:2880px;top:470px;width:180px;height:118px">
        <b style="font-size:12.5px;line-height:1.35">Rejected: split into six services</b>
        <div class="foot">decision<span class="prio">Aug 31</span></div>
      </div>

      <div class="n n-annot" style="left:3084px;top:470px;width:226px;--own:var(--h-impl)">
        <div class="who"><i class="dot" style="background:var(--h-impl)"></i>Vera · Product</div>
        Expected volume is 300 tickets/day per merchant. Nothing here justifies six deployables.
      </div>

      <div class="n n-draw" style="left:2880px;top:618px;width:240px;height:90px">
        <svg viewBox="0 0 240 90" width="240" height="90">
          <path d="M8 62 C 60 60, 76 18, 128 20 C 176 22, 190 52, 226 46" stroke="var(--h-human-2)" stroke-width="2.6"/>
          <path d="M212 34 L228 46 L210 56" stroke="var(--h-human-2)" stroke-width="2.6"/>
        </svg>
      </div>

      <div class="n n-link" style="left:2880px;top:726px;width:300px">
        <div class="fav" style="background:var(--h-design)">Fg</div>
        <div style="min-width:0px"><b>Merchant interviews · 12 calls</b><span class="u">notion.so/acme/support-research</span></div>
      </div>

      <!-- ── live cursors ────────────────────────────────── -->
      <div class="ccursor" id="cc1" style="left:1240px;top:700px">
        <svg width="18" height="21" style="color:var(--h-design)"><use href="#i-cursor"/></svg>
        <div class="tagname" style="background:var(--h-design)">Maya <em>editing Inbox · desktop</em></div>
      </div>
      <div class="ccursor" id="cc2" style="left:2440px;top:300px">
        <svg width="18" height="21" style="color:var(--h-arch)"><use href="#i-cursor"/></svg>
        <div class="tagname" style="background:var(--h-arch)">Atlas <em>writing architecture</em></div>
      </div>
      <div class="ccursor" id="cc3" style="left:520px;top:330px">
        <svg width="18" height="21" style="color:var(--h-human-2)"><use href="#i-cursor"/></svg>
        <div class="tagname" style="background:var(--h-human-2);color:#4a3d22">Krish</div>
      </div>
      <div class="ccursor" id="cc4" style="left:2320px;top:960px">
        <svg width="18" height="21" style="color:var(--h-ai)"><use href="#i-cursor"/></svg>
        <div class="tagname" style="background:var(--h-ai)">Nova <em>building retrieval</em></div>
      </div>
    </div>
  </div>

  <!-- ── top bar ──────────────────────────────────────── -->
  <div class="bar-top glass">
    <button class="btn-icon" data-go="workspaces" aria-label="Back to boards" style="color:var(--ink-2)">
      <svg class="prism" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.4l9.2 16.1a1.4 1.4 0 01-1.2 2.1H4a1.4 1.4 0 01-1.2-2.1z" fill="url(#pg)"/></svg>
    </button>
    <div class="boardname">
      <span class="crumb">Acme Support /</span><b>Support inbox</b>
      <span class="chip" style="height:24px;font-size:11.5px"><i class="dot" style="background:var(--h-product)"></i>Autosaved</span>
    </div>

    <div class="seg" style="margin-left:14px" role="group" aria-label="Board mode">
      <button aria-pressed="true" data-cmode="diagram">Diagram</button>
      <button aria-pressed="false" data-cmode="tasks">Tasks</button>
      <button aria-pressed="false" data-cmode="wireframe">Wireframe</button>
    </div>

    <div class="spacer"></div>

    <div class="presence" title="On this board now">
      <div class="avatar" style="background:var(--h-human-1)">Av</div>
      <div class="avatar" style="background:var(--h-human-2);color:#4a3d22">Kr</div>
      <div class="avatar" style="background:var(--h-design)">Ma<span class="badge">C</span></div>
      <div class="avatar" style="background:var(--h-arch)">At<span class="badge">C</span></div>
      <div class="avatar" style="background:var(--h-ai)">No<span class="badge">G</span></div>
      <div class="avatar" style="background:var(--h-impl)">Cx<span class="badge">M</span></div>
      <div class="avatar" style="background:var(--glass-strong);color:var(--ink-3);box-shadow:inset 0 0 0 1px var(--hairline)">+2</div>
    </div>
    <button class="themetoggle" id="theme-3" aria-label="Switch theme" style="margin-left:8px"><svg width="17" height="17"><use href="#i-sun"/></svg></button>
    <button class="btn btn-sm btn-glass">Share</button>
    <button class="btn btn-sm btn-primary" id="run-start"><svg width="13" height="13"><use href="#i-play"/></svg>Run team</button>
  </div>

  <!-- ── left toolbar ─────────────────────────────────── -->
  <div class="tools glass" role="toolbar" aria-label="Canvas tools">
    <button class="tool" aria-pressed="true"><svg width="19" height="19"><use href="#i-select"/></svg><span class="tip">Select<i>V</i></span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-hand"/></svg><span class="tip">Pan<i>H</i></span></button>
    <div class="toolsep"></div>
    <button class="tool"><svg width="19" height="19"><use href="#i-shape"/></svg><span class="tip">Shape<i>R</i></span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-sticky"/></svg><span class="tip">Sticky note<i>S</i></span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-text"/></svg><span class="tip">Text<i>T</i></span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-mind"/></svg><span class="tip">Mind map<i>M</i></span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-table"/></svg><span class="tip">Table</span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-connector"/></svg><span class="tip">Connector<i>C</i></span></button>
    <div class="toolsep"></div>
    <button class="tool"><svg width="19" height="19"><use href="#i-image"/></svg><span class="tip">Image</span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-link"/></svg><span class="tip">Link or embed</span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-pen"/></svg><span class="tip">Draw<i>D</i></span></button>
    <button class="tool"><svg width="19" height="19"><use href="#i-section"/></svg><span class="tip">Section<i>F</i></span></button>
    <div class="toolsep"></div>
    <button class="tool"><svg width="19" height="19"><use href="#i-comment"/></svg><span class="tip">Comment<i>K</i></span></button>
  </div>

  <!-- ── right dock ───────────────────────────────────── -->
  <aside class="dock glass">
    <div class="docktabs" role="tablist">
      <button aria-pressed="true" data-pane="team">Team</button>
      <button aria-pressed="false" data-pane="activity">Activity</button>
      <button aria-pressed="false" data-pane="comments">Comments</button>
      <button aria-pressed="false" data-pane="inspect">Object</button>
    </div>
    <div class="dockbody">

      <div class="dockpane" data-pane="team" data-on="1">
        <div class="dockh">On this board</div>
        <button class="teamrow"><div class="avatar" style="background:var(--h-human-1)">Av</div>
          <div><span class="nm">Avichal</span><span class="r">Owner · viewing Requirements</span></div></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-human-2);color:#4a3d22">Kr</div>
          <div><span class="nm">Krish</span><span class="r">Editor · editing a requirement</span></div></button>

        <div class="dockh">AI team</div>
        <button class="teamrow"><div class="avatar" style="background:var(--h-product)">Pr</div>
          <div><span class="nm">Vera</span><span class="r">Product · GPT</span></div><span class="state idle">Idle</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-design)">Ma</div>
          <div><span class="nm">Maya</span><span class="r">Design · Claude</span></div><span class="state working">Working</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-arch)">At</div>
          <div><span class="nm">Atlas</span><span class="r">Architecture · Claude</span></div><span class="state working">Working</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-ai)">No</div>
          <div><span class="nm">Nova</span><span class="r">AI systems · GPT</span></div><span class="state working">Working</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-sec)">Se</div>
          <div><span class="nm">Sentry</span><span class="r">Security · Claude</span></div><span class="state review">Reviewing</span></button>
        <button class="teamrow"><div class="avatar" style="background:var(--h-impl)">Cx</div>
          <div><span class="nm">Codex</span><span class="r">Implementation · over MCP</span></div><span class="state blocked">Blocked</span></button>

        <div class="dockh">Joined over MCP</div>
        <div class="commentcard">
          <div class="top"><svg width="13" height="13" style="color:var(--ink-3)"><use href="#i-lock"/></svg><b>Claude Code</b>
            <span class="tiny" style="margin-left:auto">2 tools today</span></div>
          <p class="mono" style="font-size:11px;color:var(--ink-3)">workspace:read workspace:write runs:execute</p>
        </div>
        <button class="btn btn-sm btn-glass" style="width:100%;justify-content:center;margin-top:4px">
          <svg width="14" height="14"><use href="#i-plus"/></svg>Add a teammate</button>
      </div>

      <div class="dockpane" data-pane="activity">
        <div class="dockh">Today</div>
        <div class="feed" id="feed">
          <div class="feeditem"><div class="avatar" style="background:var(--h-design)">Ma</div>
            <div><div class="t"><b>Maya</b> added 3 screens to Design</div><span class="when">11:42</span></div></div>
          <div class="feeditem"><div class="avatar" style="background:var(--h-arch)">At</div>
            <div><div class="t"><b>Atlas</b> replaced the queue service with Convex workflows</div><span class="when">11:43 · 6 objects changed</span></div></div>
          <div class="feeditem"><div class="avatar" style="background:var(--h-sec)">Se</div>
            <div><div class="t"><b>Sentry</b> raised 2 issues on Requirements</div><span class="when">11:44</span></div></div>
          <div class="feeditem"><div class="avatar" style="background:var(--h-human-1)">Av</div>
            <div><div class="t"><b>Avichal</b> approved “Monolith, not microservices”</div><span class="when">11:45</span></div></div>
          <div class="feeditem"><div class="avatar" style="background:var(--h-impl)">Cx</div>
            <div><div class="t"><b>Codex</b> claimed “Draft-reply endpoint” from Claude Code</div><span class="when">11:45 · via MCP</span></div></div>
          <div class="feeditem"><div class="avatar" style="background:var(--h-ai)">No</div>
            <div><div class="t"><b>Nova</b> created the retrieval workflow</div><span class="when">11:47</span></div></div>
        </div>
        <div class="dockh">Runs</div>
        <div class="commentcard">
          <div class="top"><i class="dot" style="background:var(--h-arch)"></i><b>Concept to implementation</b>
            <span class="tiny" style="margin-left:auto num">6 agents</span></div>
          <p>Finished in 2m 14s. 41 objects created, 9 modified.</p>
          <div class="acts">
            <button class="btn btn-sm btn-glass"><svg width="13" height="13"><use href="#i-undo"/></svg>Undo run</button>
            <button class="btn btn-sm btn-glass"><svg width="13" height="13"><use href="#i-history"/></svg>View changes</button>
          </div>
        </div>
      </div>

      <div class="dockpane" data-pane="comments">
        <div class="dockh">Open · 3</div>
        <div class="commentcard">
          <div class="top"><div class="avatar" style="width:20px;height:20px;font-size:8.5px;background:var(--h-arch)">At</div><b>Atlas</b>
            <span class="tiny" style="margin-left:auto">on Draft-reply endpoint</span></div>
          <p>@Codex the contract changed — drafts now return a confidence score. Regenerate the client types before you continue.</p>
          <div class="acts"><button class="btn btn-sm btn-glass">Reply</button><button class="btn btn-sm btn-glass">Resolve</button></div>
        </div>
        <div class="commentcard">
          <div class="top"><div class="avatar" style="width:20px;height:20px;font-size:8.5px;background:var(--h-sec)">Se</div><b>Sentry</b>
            <span class="tiny" style="margin-left:auto">on Escalate refunds</span></div>
          <p>This endpoint exposes sequential ticket IDs. Any merchant can walk another merchant's inbox.</p>
          <div class="acts"><button class="btn btn-sm btn-glass">Reply</button><button class="btn btn-sm btn-glass">Resolve</button></div>
        </div>
        <div class="commentcard">
          <div class="top"><div class="avatar" style="width:20px;height:20px;font-size:8.5px;background:var(--h-design)">Ma</div><b>Maya</b>
            <span class="tiny" style="margin-left:auto">on Inbox · desktop</span></div>
          <p>Two competing primary buttons. I'd make “Edit draft” secondary — sending is the job.</p>
          <div class="acts"><button class="btn btn-sm btn-glass">Reply</button><button class="btn btn-sm btn-glass">Resolve</button></div>
        </div>
        <div class="dockh">Resolved · 12</div>
      </div>

      <div class="dockpane" data-pane="inspect">
        <div class="dockh">Selected object</div>
        <div class="commentcard" style="padding:14px">
          <div class="top" style="margin-bottom:10px"><i class="dot" style="background:var(--h-product)"></i>
            <b style="font-size:13px">Anything about refunds escalates to a human</b></div>
          <div class="insprow"><span>Type</span><span class="v">sticky</span></div>
          <div class="insprow"><span>Semantic</span><span class="v">requirement</span></div>
          <div class="insprow"><span>Area</span><span class="v">product</span></div>
          <div class="insprow"><span>Priority</span><span class="v">P1</span></div>
          <div class="insprow"><span>Created by</span><span class="v">vera · gpt</span></div>
          <div class="insprow"><span>Revisions</span><span class="v">g4 c9 s2 m3</span></div>
        </div>
        <div class="dockh">Style</div>
        <div class="commentcard" style="padding:14px">
          <div class="insprow"><span>Fill</span>
            <div class="swatches">
              <i class="sw" style="background:linear-gradient(170deg,#FFE9A8,#FFDD84)"></i>
              <i class="sw" style="background:linear-gradient(170deg,#C8EFD8,#A8E3C2)"></i>
              <i class="sw" style="background:linear-gradient(170deg,#FFDFC6,#FFC9A2);box-shadow:0 0 0 2px var(--ink-2)"></i>
              <i class="sw" style="background:linear-gradient(170deg,#E4DAFA,#CEBEF4)"></i>
              <i class="sw" style="background:linear-gradient(170deg,#FFD8D8,#FFBABA)"></i>
            </div></div>
          <div class="insprow"><span>Size</span><span class="v num">152 × 112</span></div>
          <div class="insprow"><span>Position</span><span class="v num">460, 188</span></div>
          <div class="insprow"><span>Locked</span><span class="v">no</span></div>
        </div>
        <div class="dockh">Connected to</div>
        <div class="commentcard" style="padding:12px 14px">
          <div class="insprow" style="padding:6px 0"><span style="width:auto;flex:1">Inbox · desktop</span><span class="v">represented_by</span></div>
          <div class="insprow" style="padding:6px 0"><span style="width:auto;flex:1">Escalation rota</span><span class="v">delivered_by</span></div>
          <div class="insprow" style="padding:6px 0"><span style="width:auto;flex:1">Sentry comment</span><span class="v">affects</span></div>
        </div>
      </div>
    </div>
  </aside>

  <!-- ── run composer ─────────────────────────────────── -->
  <div class="runbar glass">
    <div class="runcomposer">
      <span class="who"><i class="dot" style="background:var(--h-product)"></i><i class="dot" style="background:var(--h-design)"></i>
        <i class="dot" style="background:var(--h-arch)"></i><i class="dot" style="background:var(--h-ai)"></i>
        <i class="dot" style="background:var(--h-sec)"></i><i class="dot" style="background:var(--h-impl)"></i>
        <span class="tiny" style="margin-left:3px">6 agents</span></span>
      <input id="run-input" placeholder="Team, take the refund escalation flow from concept to implementation" aria-label="Instruct the team">
      <button class="btn btn-sm btn-primary" id="run-go"><svg width="13" height="13"><use href="#i-play"/></svg>Run</button>
    </div>
    <div class="runstatus" id="runstatus">
      <div class="runline"><i class="dot" style="background:var(--h-product)"></i><span class="nm">Vera</span>
        <span class="ph">Splitting the flow into 4 requirements</span><span class="bar"><i style="width:100%;background:var(--h-product)"></i></span></div>
      <div class="runline"><i class="dot" style="background:var(--h-design)"></i><span class="nm">Maya</span>
        <span class="ph">Drawing the escalation screen</span><span class="bar"><i style="width:64%;background:var(--h-design)"></i></span></div>
      <div class="runline"><i class="dot" style="background:var(--h-arch)"></i><span class="nm">Atlas</span>
        <span class="ph">Adding the on-call service</span><span class="bar"><i style="width:38%;background:var(--h-arch)"></i></span></div>
      <div class="runline"><i class="dot" style="background:var(--h-impl)"></i><span class="nm">Codex</span>
        <span class="ph">Waiting for the API contract</span><span class="bar"><i style="width:8%;background:var(--h-impl)"></i></span></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-sm btn-glass" id="run-stop"><svg width="13" height="13"><use href="#i-stop"/></svg>Stop run</button>
        <button class="btn btn-sm btn-glass"><svg width="14" height="14"><use href="#i-undo"/></svg>Undo run</button>
        <span class="tiny" style="margin-left:auto;align-self:center">Started 11:41 · every change is attributed</span>
      </div>
    </div>
  </div>

  <!-- ── zoom + minimap ───────────────────────────────── -->
  <div class="zoombar glass">
    <button id="z-out" aria-label="Zoom out"><svg width="16" height="16"><use href="#i-minus"/></svg></button>
    <span class="lvl" id="z-lvl">62%</span>
    <button id="z-in" aria-label="Zoom in"><svg width="16" height="16"><use href="#i-plus"/></svg></button>
    <button id="z-fit" aria-label="Fit board"><svg width="16" height="16"><use href="#i-fit"/></svg></button>
  </div>

  <div class="minimap glass" aria-hidden="true">
    <div class="mm">
      <i style="left:6px;top:14px;width:34px;height:28px;background:var(--h-product)"></i>
      <i style="left:6px;top:48px;width:34px;height:26px;background:var(--h-impl)"></i>
      <i style="left:44px;top:14px;width:40px;height:18px;background:var(--h-design)"></i>
      <i style="left:44px;top:36px;width:40px;height:38px;background:var(--h-design)"></i>
      <i style="left:88px;top:14px;width:42px;height:28px;background:var(--h-arch)"></i>
      <i style="left:88px;top:46px;width:42px;height:26px;background:var(--h-ai)"></i>
      <i style="left:134px;top:16px;width:26px;height:24px;background:var(--ink-4)"></i>
      <div class="vp" id="mm-vp" style="left:4px;top:10px;width:64px;height:44px"></div>
    </div>
  </div>
</div>
</section>
<!-- ═══════════════════════════════════════ NODE SYSTEM ═════ -->
<section class="view view-nodes">
<header class="topnav glass">
  <a class="brand" href="#" data-go="landing">
    <svg class="prism" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l9.2 16.1a1.4 1.4 0 01-1.2 2.1H4a1.4 1.4 0 01-1.2-2.1z" fill="url(#pg)" opacity=".92"/></svg>
    Guild
  </a>
  <nav class="navlinks"><a href="#" data-go="workspaces">Boards</a><a href="#" data-go="canvas">Canvas</a><a href="#types">Node types</a><a href="#states">States</a></nav>
  <div class="navspace"></div>
  <button class="themetoggle" id="theme-4" aria-label="Switch theme"><svg width="17" height="17"><use href="#i-sun"/></svg></button>
  <button class="btn btn-sm btn-primary" data-go="canvas">Open a board</button>
</header>

<div class="spec">
<div class="wrap">
  <div class="band-head" style="max-width:64ch">
    <h2 class="display h-l">Fifteen objects hold the whole product.</h2>
    <p class="lede">A requirement, a database and a screen are not three node types — they're three neutral objects carrying different semantic metadata. This is every renderer in the system, with the variants and states each one supports.</p>
  </div>

  <div class="specgrid" id="types">

    <!-- shape -->
    <article class="speccell glass" style="grid-column:span 2">
      <div class="top"><b>Shape</b><span class="mono">shape</span></div>
      <div class="desc">One renderer, fourteen variants. Semantic metadata decides whether a cylinder is a database or a bucket — the geometry never changes meaning on its own.</div>
      <div class="stagebox" style="place-items:stretch">
        <div class="g"></div>
        <div style="position:relative;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center">
          <div class="n n-shape v-rectangle" style="width:104px;height:44px;font-size:11.5px">Service</div>
          <div class="n n-shape v-pill" style="width:96px;height:40px;font-size:11.5px">API</div>
          <div class="n n-shape v-circle" style="width:60px;height:60px;font-size:11px">Merge</div>
          <div class="n n-shape v-diamond" style="width:104px;height:62px;font-size:10.5px">Route?</div>
          <div class="n n-shape v-hexagon" style="width:106px;height:46px;font-size:11px">Queue</div>
          <div class="n n-shape v-cylinder" style="width:88px;height:60px;font-size:11px">tickets</div>
          <div class="n n-shape v-parallelogram" style="width:106px;height:44px;font-size:10.5px">Input</div>
          <div class="n n-shape v-trapezoid" style="width:100px;height:44px;font-size:10.5px">Budget</div>
          <div class="n n-shape v-triangle" style="width:64px;height:52px;font-size:10px">Alert</div>
          <div class="n n-shape v-star" style="width:66px;height:66px;font-size:9.5px">gate</div>
          <div class="n n-shape v-actor" style="width:64px;height:74px">
            <svg width="26" height="34" viewBox="0 0 34 46" fill="none" stroke="var(--wire)" stroke-width="2.2" stroke-linecap="round">
              <circle cx="17" cy="9" r="7"/><path d="M17 17v15M6 23h22M17 32l-8 12M17 32l8 12"/></svg>
            <span style="font-size:10.5px">User</span></div>
          <div class="n n-shape v-cloud" style="width:104px;height:58px">
            <svg viewBox="0 0 104 58" width="104" height="58" style="position:absolute;inset:0">
              <path d="M28 47 A13 13 0 0125 22 A18 18 0 0158 16 A15 15 0 0182 28 A10 10 0 0181 47 Z" fill="var(--node-fill)" stroke="var(--wire-soft)" stroke-width="1.4"/></svg>
            <span style="position:relative;font-size:10.5px;padding-top:6px">SaaS</span></div>
          <div class="n n-shape v-bracket" style="width:112px;height:48px;font-size:10.5px">Grouped</div>
          <div class="n" style="width:104px;height:2px;background:var(--wire);border-radius:2px"></div>
        </div>
      </div>
      <div class="variants"><span>rectangle</span><span>pill</span><span>circle</span><span>diamond</span><span>parallelogram</span><span>trapezoid</span><span>triangle</span><span>hexagon</span><span>cylinder</span><span>actor</span><span>cloud</span><span>bracket</span><span>star</span><span>line</span></div>
    </article>

    <!-- sticky -->
    <article class="speccell glass">
      <div class="top"><b>Sticky note</b><span class="mono">sticky</span></div>
      <div class="desc">The fastest way to put a thought on the board. Footer carries the semantic type and priority so a wall of stickies is still readable.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div style="position:relative;display:flex;gap:10px">
          <div class="n n-sticky s-amber" style="width:132px;height:104px;padding-bottom:28px">
            <b style="font-size:11.5px">Refunds need a person</b><div class="foot">problem<span class="prio">P0</span></div></div>
          <div class="n n-sticky s-mint" style="width:132px;height:104px;padding-bottom:28px">
            <b style="font-size:11.5px">Cite the real order</b><div class="foot">requirement<span class="prio">P0</span></div></div>
        </div>
      </div>
      <div class="variants"><span>amber</span><span>mint</span><span>peach</span><span>lilac</span><span>rose</span></div>
    </article>

    <!-- text -->
    <article class="speccell glass">
      <div class="top"><b>Text</b><span class="mono">text</span></div>
      <div class="desc">Unboxed prose for objectives, rationale and section notes. No fill, no border — it reads as writing on the board, not another card.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div class="n n-text" style="width:230px">
          <h5>Objective</h5>
          <p>Under two minutes to first response, and never a wrong answer.</p>
        </div>
      </div>
      <div class="variants"><span>heading</span><span>body</span><span>quote</span><span>list</span></div>
    </article>

    <!-- mind map -->
    <article class="speccell glass">
      <div class="top"><b>Mind map node</b><span class="mono">mindMapNode</span></div>
      <div class="desc">Branch nodes that auto-arrange around a root. Used for journeys and flows before they harden into shapes.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div style="position:relative;display:flex;align-items:center;gap:22px">
          <div class="n n-mind root" style="font-size:13px;padding:9px 16px">Inbox</div>
          <div style="display:grid;gap:8px">
            <div class="n n-mind" style="font-size:11.5px;padding:7px 13px">Ticket arrives</div>
            <div class="n n-mind" style="font-size:11.5px;padding:7px 13px">Draft written<span class="cnt num">2</span></div>
          </div>
        </div>
      </div>
      <div class="variants"><span>root</span><span>branch</span><span>leaf</span></div>
    </article>

    <!-- table -->
    <article class="speccell glass">
      <div class="top"><b>Table</b><span class="mono">table</span></div>
      <div class="desc">Structured rows for API surfaces, decision logs and priority matrices. Cell contents stay in the object body, not the render state.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div class="n n-table" style="width:250px">
          <div class="cap"><svg width="12" height="12" style="color:var(--ink-3)"><use href="#i-table"/></svg>Decisions</div>
          <table><thead><tr><th>Decision</th><th>State</th></tr></thead>
          <tbody><tr><td>Convex workflows</td><td>Approved</td></tr>
          <tr><td>Auto-send at 0.8</td><td>Waiting</td></tr></tbody></table>
        </div>
      </div>
      <div class="variants"><span>plain</span><span>keyed</span><span>matrix</span></div>
    </article>

    <!-- icon -->
    <article class="speccell glass">
      <div class="top"><b>Icon</b><span class="mono">icon</span></div>
      <div class="desc">A labelled glyph for services, tools and vendors. Small enough to sit inside an architecture diagram without competing with shapes.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div style="position:relative;display:flex;gap:14px">
          <div class="n n-icon"><div class="box"><svg width="20" height="20" style="color:var(--h-arch)"><use href="#i-db"/></svg></div><div class="cap">Postgres</div></div>
          <div class="n n-icon"><div class="box"><svg width="20" height="20" style="color:var(--h-product)"><use href="#i-cloud"/></svg></div><div class="cap">Convex</div></div>
          <div class="n n-icon"><div class="box"><svg width="20" height="20" style="color:var(--h-sec)"><use href="#i-shield"/></svg></div><div class="cap">WorkOS</div></div>
        </div>
      </div>
      <div class="variants"><span>service</span><span>vendor</span><span>status</span></div>
    </article>

    <!-- image -->
    <article class="speccell glass">
      <div class="top"><b>Image</b><span class="mono">image</span></div>
      <div class="desc">Uploaded reference or a placeholder an agent can fill later. The empty state names the file it's waiting for.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div class="n n-image" style="width:200px;height:118px">
          <div class="ph"><svg width="20" height="20"><use href="#i-image"/></svg>merchant-inbox-ref.png</div>
        </div>
      </div>
      <div class="variants"><span>upload</span><span>placeholder</span><span>screenshot</span></div>
    </article>

    <!-- link -->
    <article class="speccell glass">
      <div class="top"><b>Link</b><span class="mono">link</span></div>
      <div class="desc">A pull request, a doc, a research call. Carries a title so the board stays readable when the URL doesn't.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div class="n n-link" style="width:250px">
          <div class="fav" style="background:#1C1B19">GH</div>
          <div style="min-width:0px"><b>acme/support-api · PR #219</b><span class="u">github.com/acme/support-api</span></div>
        </div>
      </div>
      <div class="variants"><span>link</span><span>embed</span><span>file</span></div>
    </article>

    <!-- section -->
    <article class="speccell glass" style="grid-column:span 2">
      <div class="top"><b>Section</b><span class="mono">section</span></div>
      <div class="desc">A container that gives agents somewhere to work without colliding. The header tints to the area's owner and the interior glows faintly while that agent is active inside it.</div>
      <div class="stagebox" style="place-items:stretch;padding:30px 22px 22px">
        <div class="g"></div>
        <div class="n n-section" style="position:relative;left:auto;top:auto;width:100%;height:150px;--own:var(--h-arch)">
          <span class="glow"></span>
          <div class="hd"><i class="dot" style="background:var(--h-arch)"></i><b>SYSTEM ARCHITECTURE</b><span class="cnt num">12 objects</span>
            <div class="avatar" style="width:17px;height:17px;font-size:8px;background:var(--h-arch);box-shadow:none">At</div></div>
          <div style="display:flex;gap:12px;padding:26px 18px;align-items:center">
            <div class="n n-shape v-rectangle" style="position:relative;left:auto;top:auto;width:98px;height:40px;font-size:11px">Web app</div>
            <div class="n n-shape v-pill" style="position:relative;left:auto;top:auto;width:88px;height:38px;font-size:11px">API</div>
            <div class="n n-shape v-cylinder" style="position:relative;left:auto;top:auto;width:80px;height:56px;font-size:10.5px">tickets</div>
          </div>
        </div>
      </div>
      <div class="variants"><span>area</span><span>swimlane</span><span>nested</span></div>
    </article>

    <!-- annotation -->
    <article class="speccell glass">
      <div class="top"><b>Annotation</b><span class="mono">annotation</span></div>
      <div class="desc">An agent's remark pinned beside the work rather than inside it. Tinted to the author so you can tell a security note from a design note at a glance.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div style="position:relative;display:grid;gap:9px">
          <div class="n n-annot" style="width:224px;--own:var(--h-sec)">
            <div class="who"><svg width="11" height="11"><use href="#i-shield"/></svg>Sentry · Security</div>
            This endpoint exposes sequential ticket IDs.</div>
          <div class="n n-annot" style="width:224px;--own:var(--h-design)">
            <div class="who"><i class="dot" style="background:var(--h-design)"></i>Maya · Design</div>
            Two competing primary actions on this screen.</div>
        </div>
      </div>
      <div class="variants"><span>note</span><span>concern</span><span>callout</span></div>
    </article>

    <!-- drawing -->
    <article class="speccell glass">
      <div class="top"><b>Drawing</b><span class="mono">drawing</span></div>
      <div class="desc">Freehand strokes in your presence colour. Circling and arrows are how people point at things mid-conversation.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div class="n n-draw" style="width:230px;height:104px">
          <svg viewBox="0 0 230 104" width="230" height="104">
            <path d="M18 66 C 56 26, 128 20, 168 40" stroke="var(--h-human-1)" stroke-width="2.6"/>
            <path d="M152 26 L172 41 L150 54" stroke="var(--h-human-1)" stroke-width="2.6"/>
            <path d="M30 88 C 78 82, 130 90, 200 74" stroke="var(--h-human-2)" stroke-width="2.6" opacity=".85"/>
          </svg>
        </div>
      </div>
      <div class="variants"><span>pen</span><span>highlighter</span><span>arrow</span></div>
    </article>

    <!-- task -->
    <article class="speccell glass">
      <div class="top"><b>Task card</b><span class="mono">task</span></div>
      <div class="desc">Title, checklist, status, labels and assignee — human or agent. This is the object Claude Code claims over MCP and reports back to.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div class="n n-task" style="width:230px">
          <div class="tt">Draft-reply endpoint</div>
          <div class="checks">
            <div class="ck done"><i><svg width="8" height="8" style="color:#fff"><use href="#i-check"/></svg></i>Schema</div>
            <div class="ck"><i></i>Streaming response</div>
          </div>
          <div class="tfoot"><span class="tag" style="background:color-mix(in srgb,var(--h-sec) 18%,transparent);color:var(--h-sec)">P0</span>
            <span class="tag" style="background:var(--shade);color:var(--ink-3)">backend</span>
            <div class="avatar" style="background:var(--h-impl)">Cx</div></div>
        </div>
      </div>
      <div class="variants"><span>task</span><span>bug</span><span>review</span><span>test</span></div>
    </article>

    <!-- stack -->
    <article class="speccell glass">
      <div class="top"><b>Stack</b><span class="mono">stack</span></div>
      <div class="desc">An ordered container of task cards. Stages are just stacks, so a board can hold a sprint and an architecture diagram side by side.</div>
      <div class="stagebox">
        <div class="g"></div>
        <div class="n n-stack" style="width:200px">
          <div class="sh"><i class="dot" style="background:var(--h-arch)"></i><b>IN PROGRESS</b><span class="cnt num">2</span></div>
          <div class="n n-task"><div class="tt">Draft-reply endpoint</div>
            <div class="tfoot"><span class="tag" style="background:var(--shade);color:var(--ink-3)">backend</span>
              <div class="avatar" style="background:var(--h-impl)">Cx</div></div></div>
          <div class="add">Add card</div>
        </div>
      </div>
      <div class="variants"><span>backlog</span><span>in progress</span><span>review</span><span>shipped</span></div>
    </article>

    <!-- wireframe frame -->
    <article class="speccell glass" style="grid-column:span 2">
      <div class="top"><b>Wireframe frame</b><span class="mono">wireframeFrame</span></div>
      <div class="desc">A device shell that clips and lays out wireframe components. Frames are containers, so an agent can be told to "redraw the empty state" without touching the rest of the board.</div>
      <div class="stagebox" style="place-items:center;padding:26px">
        <div class="g"></div>
        <div style="position:relative;display:flex;gap:18px;align-items:flex-start">
          <div class="n n-wf" style="position:relative;left:auto;top:auto;width:250px;height:158px">
            <div class="chrome"><div class="dots"><i></i><i></i><i></i></div><div class="url">app.acme.support/inbox</div></div>
            <div class="screen" style="height:calc(100% - 26px);gap:7px">
              <div class="wc-nav"><b>Ticket #4821</b><span>open</span></div>
              <div class="wc-card" style="padding:7px"><div class="wc-line" style="width:90%"></div><div class="wc-line" style="width:64%"></div></div>
              <div class="wc-btn" style="height:24px">Send reply</div>
            </div>
          </div>
          <div class="n n-wf mobile" style="position:relative;left:auto;top:auto;width:104px;height:172px">
            <div class="chrome"><span>9:41</span><span>▲▮</span></div>
            <div class="screen" style="height:calc(100% - 18px);gap:7px;padding:9px">
              <div class="wc-line" style="width:56%;height:8px"></div>
              <div class="wc-card" style="padding:6px"><div class="wc-line" style="width:88%"></div></div>
              <div class="wc-card" style="padding:6px"><div class="wc-line" style="width:70%"></div></div>
              <div class="wc-btn" style="height:22px;margin-top:auto">Open</div>
            </div>
          </div>
          <div class="n n-wf" style="position:relative;left:auto;top:auto;width:132px;height:158px;border-radius:14px">
            <div class="chrome" style="justify-content:center"><div class="url" style="flex:none;width:38px;height:5px;border-radius:99px"></div></div>
            <div class="screen" style="height:calc(100% - 26px);gap:7px;padding:9px">
              <div class="wc-rect" style="height:34px"></div>
              <div class="wc-line" style="width:80%"></div>
              <div class="wc-line" style="width:58%"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="variants"><span>browser</span><span>desktop</span><span>tablet</span><span>mobile</span></div>
    </article>

    <!-- wireframe component -->
    <article class="speccell glass" style="grid-column:span 2">
      <div class="top"><b>Wireframe component</b><span class="mono">wireframeComponent</span></div>
      <div class="desc">Low fidelity on purpose: structured, editable, and cheap for an agent to generate seventeen of. Every variant renders from the same payload shape.</div>
      <div class="stagebox" style="place-items:stretch;padding:22px">
        <div class="g"></div>
        <div style="position:relative;display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:16px;align-items:start" class="wc">
          <div><div class="tiny" style="margin-bottom:6px">Button</div><div class="wc-btn">Send reply</div></div>
          <div><div class="tiny" style="margin-bottom:6px">Input</div><div class="wc-input">Search tickets</div></div>
          <div><div class="tiny" style="margin-bottom:6px">Select</div><div class="wc-select">Status<span>▾</span></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Textarea</div><div class="wc-textarea">Reply…</div></div>
          <div><div class="tiny" style="margin-bottom:6px">Checkbox</div><div class="wc-check"><i></i>Auto-send</div><div class="wc-check" style="margin-top:7px"><i></i>Notify me</div></div>
          <div><div class="tiny" style="margin-bottom:6px">Radio</div><div class="wc-check wc-radio"><i></i>Draft</div><div class="wc-check wc-radio" style="margin-top:7px"><i></i>Send now</div></div>
          <div><div class="tiny" style="margin-bottom:6px">Tabs</div><div class="wc-tabs"><span class="on">Draft</span><span>Order</span></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Menu</div><div class="wc-menu"><span class="on">Reply</span><span>Escalate</span><span>Snooze</span></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Navigation</div><div class="wc-nav"><b>Inbox</b><span>Reports</span><span>Settings</span></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Table</div><div class="wc-table"><div class="r h"><span>Ticket</span><span>Status</span><span>Age</span></div><div class="r"><span>#4821</span><span>Open</span><span>2h</span></div><div class="r"><span>#4820</span><span>Sent</span><span>5h</span></div></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Avatar</div><div style="display:flex;gap:6px"><div class="wc-avatar"></div><div class="wc-avatar"></div><div class="wc-avatar"></div></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Card</div><div class="wc-card"><div class="wc-line" style="width:88%"></div><div class="wc-line" style="width:60%"></div></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Modal</div><div class="wc-modal"><div class="wc-line" style="width:60%"></div><div class="wc-line" style="width:88%"></div><div class="wc-btn" style="height:22px">Confirm</div></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Browser bar</div><div class="wc-input" style="height:22px;font-size:9px;border-radius:6px">app.acme.support</div></div>
          <div><div class="tiny" style="margin-bottom:6px">Status bar</div><div style="display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:9px;color:var(--ink-3);padding:5px 8px" class="wc-rect">9:41<span>▲ ▮ ▮</span></div></div>
          <div><div class="tiny" style="margin-bottom:6px">Shapes</div><div style="display:flex;gap:8px;align-items:center"><div class="wc-rect" style="width:34px;height:26px"></div><div class="wc-circle" style="width:26px;height:26px"></div><div class="wc-hr" style="width:34px"></div></div></div>
        </div>
      </div>
      <div class="variants"><span>button</span><span>input</span><span>textarea</span><span>checkbox</span><span>radio</span><span>select</span><span>tabs</span><span>menu</span><span>navigation</span><span>table</span><span>avatar</span><span>card</span><span>modal</span><span>browserBar</span><span>statusBar</span><span>rectangle</span><span>circle</span><span>line</span></div>
    </article>

    <!-- connector -->
    <article class="speccell glass" style="grid-column:span 2">
      <div class="top"><b>Connector</b><span class="mono">edge · connector</span></div>
      <div class="desc">The only edge type. A solid line is a drawn relationship; a dashed line is a semantic one an agent inferred. The label is the relationship the graph reasons over — <span class="mono">informs</span>, <span class="mono">writes_to</span>, <span class="mono">blocks</span>, <span class="mono">verified_by</span>.</div>
      <div class="stagebox" style="place-items:center">
        <div class="g"></div>
        <div class="abs" style="width:100%;max-width:520px;height:150px">
          <svg viewBox="0 0 520 130" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="var(--wire)" stroke-width="1.8">
            <defs><marker id="ar2" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1.2 L9 5 L0 8.8z" fill="var(--wire)"/></marker></defs>
            <path d="M112 40 H190" marker-end="url(#ar2)"/>
            <path d="M112 96 C 150 96, 152 40, 190 40" stroke-dasharray="6 5" marker-end="url(#ar2)"/>
            <path d="M300 40 C 350 40, 350 96, 400 96" marker-end="url(#ar2)"/>
          </svg>
          <div class="n n-shape v-rectangle" style="left:14px;top:22px;width:98px;height:38px;font-size:11px">Requirement</div>
          <div class="n n-shape v-rectangle" style="left:14px;top:78px;width:98px;height:38px;font-size:11px">Decision</div>
          <div class="n n-shape v-rectangle" style="left:190px;top:22px;width:110px;height:38px;font-size:11px">Draft engine</div>
          <div class="n n-shape v-cylinder" style="left:400px;top:86px;width:88px;height:58px;font-size:11px">tickets</div>
          <div class="elabel" style="left:151px;top:30px">implements</div>
          <div class="elabel" style="left:350px;top:60px">writes_to</div>
        </div>
      </div>
      <div class="variants"><span>straight</span><span>elbow</span><span>curve</span><span>dashed · inferred</span><span>labelled</span></div>
    </article>
  </div>

  <!-- states -->
  <div class="band-head" style="margin:74px 0 30px;max-width:60ch" id="states">
    <h2 class="display h-m">Every object carries the same collaboration states.</h2>
    <p class="lede">Ownership is colour, and the colour is the same everywhere — cursor, selection ring, authorship glow, annotation tint. You learn six colours once.</p>
  </div>

  <div class="statesrow glass">
    <div class="statecase"><div class="holder">
      <div class="n n-sticky s-mint" style="width:150px;height:94px;padding-bottom:28px"><b style="font-size:11.5px">Cite the real order</b><div class="foot">requirement<span class="prio">P0</span></div></div>
    </div><div class="cap">Default</div></div>

    <div class="statecase"><div class="holder">
      <div class="n n-sticky s-mint" style="width:150px;height:94px;padding-bottom:28px;--own:var(--h-human-2)" data-sel="Krish"><b style="font-size:11.5px">Cite the real order</b><div class="foot">requirement<span class="prio">P0</span></div></div>
    </div><div class="cap">Selected by a teammate</div></div>

    <div class="statecase"><div class="holder">
      <div class="n n-sticky s-mint leased" style="width:150px;height:94px;padding-bottom:28px;--own:var(--h-human-1)"><b style="font-size:11.5px">Cite the real order</b><div class="foot">requirement<span class="prio">P0</span></div></div>
    </div><div class="cap">Held for editing</div></div>

    <div class="statecase"><div class="holder">
      <div class="n n-sticky s-mint" style="width:150px;height:94px;padding-bottom:28px;--own:var(--h-ai)" data-by="1"><b style="font-size:11.5px">Cite the real order</b><div class="foot">requirement<span class="prio">P0</span></div></div>
    </div><div class="cap">Just written by Nova</div></div>

    <div class="statecase"><div class="holder">
      <div class="n n-sticky s-mint" style="width:150px;height:94px;padding-bottom:28px"><b style="font-size:11.5px">Cite the real order</b><div class="foot">requirement<span class="prio">P0</span></div></div>
      <div class="pin" style="left:136px;top:-11px;background:var(--h-sec)">2</div>
    </div><div class="cap">Has open comments</div></div>

    <div class="statecase"><div class="holder">
      <div class="n n-sticky s-mint" style="width:150px;height:94px;padding-bottom:28px;opacity:.62" data-lock="1"><b style="font-size:11.5px">Cite the real order</b><div class="foot">requirement<span class="prio">P0</span></div>
        <span class="lockpin"><svg width="12" height="12"><use href="#i-lock"/></svg></span></div>
    </div><div class="cap">Locked</div></div>
  </div>

  <div class="band-head" style="margin:70px 0 24px;max-width:60ch">
    <h2 class="display h-m">Presence overlays are never canvas objects.</h2>
    <p class="lede">Cursors, selections, agent activity and comment pins live above the board and are thrown away when the session ends. Nothing an agent is <em>doing</em> gets persisted as something it <em>made</em>.</p>
  </div>

  <div class="statesrow glass" style="gap:40px">
    <div class="statecase"><div class="holder" style="height:64px">
      <div class="ccursor" style="left:14px;top:4px;position:absolute;transition:none">
        <svg width="18" height="21" style="color:var(--h-design)"><use href="#i-cursor"/></svg>
        <div class="tagname" style="background:var(--h-design)">Maya <em>editing</em></div></div>
    </div><div class="cap">Agent cursor with current phase</div></div>

    <div class="statecase"><div class="holder" style="height:64px">
      <div class="ccursor" style="left:14px;top:4px;position:absolute;transition:none">
        <svg width="18" height="21" style="color:var(--h-human-1)"><use href="#i-cursor"/></svg>
        <div class="tagname" style="background:var(--h-human-1)">Avichal</div></div>
    </div><div class="cap">Human cursor</div></div>

    <div class="statecase"><div class="holder" style="height:64px;width:190px">
      <div class="avatar" style="position:absolute;left:0;background:var(--h-arch)">At<span class="badge">C</span></div>
      <div class="avatar" style="position:absolute;left:22px;background:var(--h-ai)">No<span class="badge">G</span></div>
      <div class="avatar" style="position:absolute;left:44px;background:var(--h-impl)">Cx<span class="badge">M</span></div>
      <div class="tiny" style="position:absolute;left:96px;top:4px">C · Claude<br>G · GPT<br>M · over MCP</div>
    </div><div class="cap">Provider badges</div></div>

    <div class="statecase"><div class="holder" style="height:64px;width:180px">
      <div class="runcard" style="padding:10px 12px;width:180px">
        <div class="runline" style="font-size:11.5px"><i class="dot" style="background:var(--h-design)"></i><span class="nm" style="width:44px">Maya</span>
          <span class="bar"><i style="width:64%;background:var(--h-design)"></i></span></div>
      </div>
    </div><div class="cap">Live run progress</div></div>
  </div>

  <div class="cta glass glass-2" style="margin-top:78px">
    <h2 class="display h-l">See it moving.</h2>
    <p class="lede">The board is where all of this comes together — six agents, two humans, one project.</p>
    <div class="row">
      <button class="btn btn-primary" data-go="canvas">Open the board</button>
      <button class="btn btn-glass" data-go="landing">Back to the overview</button>
    </div>
  </div>
</div>
</div>
</section>

<!-- prototype view switcher -->
<div class="switcher glass" role="group" aria-label="Prototype screens">
  <span class="tiny">Screens</span>
  <button data-go="landing" aria-pressed="true">Landing</button>
  <button data-go="workspaces" aria-pressed="false">Boards</button>
  <button data-go="canvas" aria-pressed="false">Canvas</button>
  <button data-go="nodes" aria-pressed="false">Nodes</button>
</div>
<script>
(function(){
  const html = document.documentElement;

  /* ── theme ─────────────────────────────────────────── */
  function setTheme(t){
    html.setAttribute('data-theme', t);
    document.querySelectorAll('.themetoggle use').forEach(u=>{
      u.setAttribute('href', t === 'dark' ? '#i-sun' : '#i-moon');
    });
    document.querySelectorAll('.themetoggle').forEach(b=>{
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }
  document.addEventListener('click', e=>{
    const t = e.target.closest('.themetoggle');
    if(!t) return;
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  setTheme('dark');

  /* ── view routing ──────────────────────────────────── */
  function go(view){
    html.setAttribute('data-view', view);
    document.querySelectorAll('.switcher button').forEach(b=>{
      b.setAttribute('aria-pressed', String(b.dataset.go === view));
    });
    window.scrollTo({top:0, behavior:'instant'});
    if(view === 'canvas') requestAnimationFrame(sizeMinimap);
  }
  document.addEventListener('click', e=>{
    const el = e.target.closest('[data-go]');
    if(!el) return;
    e.preventDefault();
    go(el.dataset.go);
  });

  /* ── landing: mode stage ───────────────────────────── */
  document.querySelectorAll('.modebtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.modebtn').forEach(b=>b.setAttribute('aria-pressed', String(b === btn)));
      document.querySelectorAll('.stage-pane').forEach(p=>{
        p.dataset.on = p.dataset.mode === btn.dataset.mode ? '1' : '0';
      });
    });
  });

  /* ── landing: hero cursors drift ───────────────────── */
  const heroTracks = {
    hc1: [[286,208],[332,168],[260,248],[304,192]],
    hc2: [[518,428],[562,460],[490,468],[536,440]],
    hc3: [[186,368],[150,406],[230,352],[196,386]]
  };
  let heroStep = 0;
  function driftHero(){
    heroStep++;
    for(const id in heroTracks){
      const el = document.getElementById(id);
      if(!el) continue;
      const p = heroTracks[id][heroStep % heroTracks[id].length];
      el.style.left = p[0] + 'px';
      el.style.top  = p[1] + 'px';
    }
  }
  setInterval(driftHero, 2800);

  /* ── canvas: pan + zoom ────────────────────────────── */
  const vp = document.getElementById('viewport');
  const world = document.getElementById('world');
  const lvl = document.getElementById('z-lvl');
  const mmvp = document.getElementById('mm-vp');
  const BOARD = {w:3480, h:1560};
  let tx = 34, ty = 76, scale = 0.62;

  const dots = vp ? vp.querySelector('.dots') : null;
  function apply(){
    world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if(dots){
      const g = 24 * scale;
      dots.style.backgroundSize = g + 'px ' + g + 'px';
      dots.style.backgroundPosition = (tx % g) + 'px ' + (ty % g) + 'px';
    }
    if(lvl) lvl.textContent = Math.round(scale * 100) + '%';
    sizeMinimap();
  }
  function sizeMinimap(){
    if(!mmvp || !vp) return;
    const mw = 168, mh = 110;
    const sx = mw / BOARD.w, sy = mh / BOARD.h;
    const w = (vp.clientWidth  / scale) * sx;
    const h = (vp.clientHeight / scale) * sy;
    mmvp.style.left   = Math.max(0, (-tx / scale) * sx) + 'px';
    mmvp.style.top    = Math.max(0, (-ty / scale) * sy) + 'px';
    mmvp.style.width  = Math.min(mw, w) + 'px';
    mmvp.style.height = Math.min(mh, h) + 'px';
  }

  if(vp){
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

    vp.addEventListener('pointerdown', e=>{
      if(e.target.closest('button, a, input')) return;
      dragging = true; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
      vp.classList.add('grabbing');
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener('pointermove', e=>{
      if(!dragging) return;
      tx = ox + (e.clientX - sx);
      ty = oy + (e.clientY - sy);
      apply();
    });
    const stop = e=>{ dragging = false; vp.classList.remove('grabbing'); };
    vp.addEventListener('pointerup', stop);
    vp.addEventListener('pointercancel', stop);

    vp.addEventListener('wheel', e=>{
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      if(e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 40 && !e.shiftKey){
        const next = Math.min(2.2, Math.max(0.18, scale * (e.deltaY > 0 ? 0.92 : 1.08)));
        tx = mx - (mx - tx) * (next / scale);
        ty = my - (my - ty) * (next / scale);
        scale = next;
      } else {
        tx -= e.deltaX; ty -= e.deltaY;
      }
      apply();
    }, {passive:false});

    const zoomTo = f=>{
      const r = vp.getBoundingClientRect();
      const mx = r.width/2, my = r.height/2;
      const next = Math.min(2.2, Math.max(0.18, scale * f));
      tx = mx - (mx - tx) * (next / scale);
      ty = my - (my - ty) * (next / scale);
      scale = next; apply();
    };
    document.getElementById('z-in') ?.addEventListener('click', ()=>zoomTo(1.18));
    document.getElementById('z-out')?.addEventListener('click', ()=>zoomTo(0.85));
    document.getElementById('z-fit')?.addEventListener('click', ()=>{
      const pad = {l:80, r:350, t:90, b:110};
      const aw = vp.clientWidth - pad.l - pad.r;
      const ah = vp.clientHeight - pad.t - pad.b;
      scale = Math.min(aw / BOARD.w, ah / BOARD.h);
      tx = pad.l + (aw - BOARD.w * scale) / 2;
      ty = pad.t + (ah - BOARD.h * scale) / 2;
      apply();
    });
    apply();
  }

  /* ── canvas: board cursors wander between real objects ── */
  const boardTracks = {
    cc1: [[1240,700],[1010,760],[1180,905],[1396,742]],
    cc2: [[2440,300],[2286,246],[2470,378],[2624,208]],
    cc3: [[624,320],[812,268],[700,478],[452,344]],
    cc4: [[2320,960],[2140,918],[2500,996],[2286,1094]]
  };
  let boardStep = 0;
  setInterval(()=>{
    if(html.getAttribute('data-view') !== 'canvas') return;
    boardStep++;
    for(const id in boardTracks){
      const el = document.getElementById(id);
      if(!el) continue;
      const p = boardTracks[id][boardStep % boardTracks[id].length];
      el.style.left = p[0] + 'px';
      el.style.top  = p[1] + 'px';
    }
  }, 3000);

  /* ── canvas: dock tabs ─────────────────────────────── */
  document.querySelectorAll('.docktabs button').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.docktabs button').forEach(x=>x.setAttribute('aria-pressed', String(x === b)));
      document.querySelectorAll('.dockpane').forEach(p=>p.dataset.on = p.dataset.pane === b.dataset.pane ? '1' : '0');
    });
  });

  /* ── canvas: mode segmented control ────────────────── */
  document.querySelectorAll('[data-cmode]').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('[data-cmode]').forEach(x=>x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  /* ── canvas: run controls ──────────────────────────── */
  const status = document.getElementById('runstatus');
  const startRun = ()=>{ if(status) status.dataset.on = '1'; };
  document.getElementById('run-go')   ?.addEventListener('click', startRun);
  document.getElementById('run-start')?.addEventListener('click', ()=>{ go('canvas'); startRun(); });
  document.getElementById('run-input')?.addEventListener('keydown', e=>{ if(e.key === 'Enter') startRun(); });
  document.getElementById('run-stop') ?.addEventListener('click', ()=>{ if(status) status.dataset.on = '0'; });

  /* ── toolbar single-select ─────────────────────────── */
  document.querySelectorAll('.tools .tool').forEach(t=>{
    t.addEventListener('click', ()=>{
      document.querySelectorAll('.tools .tool').forEach(x=>x.setAttribute('aria-pressed', String(x === t)));
    });
  });

  /* ── smooth anchor scroll on landing ───────────────── */
  document.querySelectorAll('a[href^="#"]:not([data-go])').forEach(a=>{
    a.addEventListener('click', e=>{
      const el = document.querySelector(a.getAttribute('href'));
      if(!el) return;
      e.preventDefault();
      el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
})();
</script>
</body>
</html>
