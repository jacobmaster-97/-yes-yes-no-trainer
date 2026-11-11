const { spawnSync } = require('node:child_process');
const path = require('node:path');

for (const file of ['trainer.cjs', 'kmh.cjs', 'extra.cjs', 'pages.cjs']) {
  console.log(`\nRunning ${file}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], {
    stdio: 'inherit',
    env: process.env
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('\nAll trainer checks passed.');
