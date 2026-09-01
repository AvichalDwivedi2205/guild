#!/usr/bin/env node
process.stdout.write(`${JSON.stringify({ type: 'system', subtype: 'init' })}\n`);
process.stdin.resume();

const keepAlive = setInterval(() => undefined, 1_000);
function stop() {
  clearInterval(keepAlive);
  process.exit(0);
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
