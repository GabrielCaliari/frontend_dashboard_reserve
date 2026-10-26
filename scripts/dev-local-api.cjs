/**
 * Sobe o painel contra a API local (http://localhost:3002), e nao contra a de
 * producao do .env.local. Variavel ja definida no processo vence o .env.local.
 *
 * Uso: node scripts/dev-local-api.cjs
 */
const { spawn } = require('child_process');
const path = require('path');

const env = {
  ...process.env,
  NEXT_PUBLIC_RESERVE_API_URL: 'http://localhost:3002/api',
  NEXT_PUBLIC_RESERVE_API_EMAIL_URL: 'http://localhost:3002/api',
};

const root = path.resolve(__dirname, '..');
const child = spawn('npx', ['next', 'dev', '-p', '3000'], { cwd: root, env, stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
