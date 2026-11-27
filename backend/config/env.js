import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'config.env');
dotenv.config({ path: configPath });

const required = ['DATABASE', 'CLIENT_URL'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(`WARNING: Missing env vars: ${missing.join(', ')}. App will attempt to start but database features may fail.`);
}

export default process.env;
