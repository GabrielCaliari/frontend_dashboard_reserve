/**
 * Sobe o painel contra a API local (http://localhost:3002), e nao contra a de
 * producao do .env.local. Variavel ja definida no processo vence o .env.local.
 *
 * Uso: node scripts/dev-local-api.cjs [--api http://localhost:3002/api]
 */
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const apiArg = process.argv.indexOf('--api');
const API = apiArg > -1 ? process.argv[apiArg + 1] : 'http://localhost:3002/api';

const env = {
  ...process.env,
  NEXT_PUBLIC_RESERVE_API_URL: API,
  NEXT_PUBLIC_RESERVE_API_EMAIL_URL: API,
};

const root = path.resolve(__dirname, '..');
const child = spawn('npx', ['next', 'dev', '-p', '3000'], { cwd: root, env, stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));

// Com shell: true o servidor roda num neto; sem derrubar a arvore, parar o
// launcher deixa a porta presa por um processo orfao (visto no Windows).
const stop = () => {
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else child.kill('SIGTERM');
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
