const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'yes-yes-no-trainer.html');
const artifactDirectory = path.join(root, '.test-artifacts');
function artifactPath(name) {
  fs.mkdirSync(artifactDirectory, { recursive: true });
  return path.join(artifactDirectory, name);
}
const executablePath = process.env.CHROMIUM_PATH ||
  ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
const launchOptions = {
  headless: true,
  args: ['--no-sandbox'],
  ...(executablePath ? { executablePath } : {})
};

module.exports = { htmlPath, artifactPath, launchOptions };
