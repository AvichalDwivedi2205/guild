const mode = process.argv[2];

if (mode === 'output') {
  const chunk = 'x'.repeat(4_096);
  setInterval(() => process.stdout.write(chunk), 1);
} else if (mode === 'ignore-term') {
  process.on('SIGTERM', () => undefined);
  setInterval(() => process.stdout.write('still-running\n'), 50);
} else if (mode === 'turns') {
  let turn = 0;
  setInterval(() => {
    turn += 1;
    process.stdout.write(`${JSON.stringify({ type: 'turn.started', turn })}\n`);
  }, 5);
} else if (mode === 'codex-failure') {
  process.stdout.write(
    `${JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'attempted work' } })}\n`,
  );
  process.stdout.write(
    `${JSON.stringify({ type: 'turn.failed', message: 'MCP write rejected' })}\n`,
  );
  process.exitCode = 1;
} else if (mode === 'echo') {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  process.stdin.on('end', () => {
    process.stdout.write(JSON.stringify({ args: process.argv.slice(3), input, env: process.env }));
  });
} else {
  process.stderr.write('unknown fixture mode\n');
  process.exitCode = 2;
}
