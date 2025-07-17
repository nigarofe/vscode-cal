const fs = require('fs');
const path = require('path');

const API_KEYS_FILE = path.join(__dirname, 'api_keys.json');
const ENV_FILE = path.join(__dirname, '..', '.env');
const KEY_NAME = 'GEMINI_API_KEY';

let keys = [];
let currentKeyIndex = 0;

// Load keys from JSON file
try {
  const data = fs.readFileSync(API_KEYS_FILE, 'utf8');
  const config = JSON.parse(data);
  if (config.keys && Array.isArray(config.keys)) {
    keys = config.keys;
  } else {
    console.error('Error: api_keys.json is missing a "keys" array.');
    process.exit(1);
  }
} catch (error) {
  console.error('Error reading or parsing api_keys.json:', error);
  process.exit(1);
}

function rotateKeyAndUpdateEnv() {
  if (keys.length === 0) {
    console.error('No keys available to rotate.');
    return;
  }

  // Determine the current key from the .env file to find the next one
  let currentKey = '';
  if (fs.existsSync(ENV_FILE)) {
      const envContent = fs.readFileSync(ENV_FILE, 'utf8');
      const match = envContent.match(new RegExp(`^${KEY_NAME}=(.*)$`, 'm'));
      if (match) {
          currentKey = match[1];
      }
  }

  const currentIndex = keys.indexOf(currentKey);
  const nextIndex = (currentIndex + 1) % keys.length;
  const newKey = keys[nextIndex];
  const oldKey = currentKey || 'N/A';

  updateEnvFile(newKey);

  console.log(`Updated ${ENV_FILE}`);
  console.log(`Old key: ${oldKey}`);
  console.log(`New key: ${newKey}`);
}

function updateEnvFile(newKey) {
  let content = '';
  if (fs.existsSync(ENV_FILE)) {
    content = fs.readFileSync(ENV_FILE, 'utf8');
  }

  const keyRegex = new RegExp(`^${KEY_NAME}=.*$`, 'm');

  if (keyRegex.test(content)) {
    // If key exists, replace it
    content = content.replace(keyRegex, `${KEY_NAME}=${newKey}`);
  } else {
    // If key doesn't exist, add it to the end
    content += (content.endsWith('\n') ? '' : '\n') + `${KEY_NAME}=${newKey}\n`;
  }

  fs.writeFileSync(ENV_FILE, content);
}

// This allows the script to be executed directly
if (require.main === module) {
  rotateKeyAndUpdateEnv();
}

module.exports = {
  rotateKeyAndUpdateEnv
};