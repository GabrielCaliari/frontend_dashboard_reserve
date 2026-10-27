/**
 * Sobe o painel contra a API local, e nao contra a de producao do .env.local.
 * Variavel ja definida no processo vence o .env.local.
 *
 * Roda o `next dev` NESTE processo (sem shell nem filho intermediario): parar o
 * launcher para o painel, sem deixar a porta 3000 presa por um orfao.
 *
 * Uso: node scripts/dev-local-api.cjs [--api http://localhost:3002/api] [--port 3000]
 */
const path = require('path');

const apiArg = process.argv.indexOf('--api');
const API = apiArg > -1 ? process.argv[apiArg + 1] : 'http://localhost:3002/api';
const ORIGIN = API.replace(/\/api\/?$/, '');
const portArg = process.argv.indexOf('--port');
const PORT = portArg > -1 ? process.argv[portArg + 1] : '3000';

Object.assign(process.env, {
  NEXT_PUBLIC_RESERVE_API_URL: API,
  NEXT_PUBLIC_RESERVE_API_EMAIL_URL: API,
  // Em development o axios usa NEXT_PUBLIC_LOCAL_API_URL (origem, sem /api).
  NEXT_PUBLIC_LOCAL_API_URL: ORIGIN,
  NEXT_LOCAL_API_URL: ORIGIN,
});

const root = path.resolve(__dirname, '..');
process.chdir(root);
const nextBin = require.resolve('next/dist/bin/next', { paths: [root] });
process.argv = [process.argv[0], nextBin, 'dev', '-p', PORT];
require(nextBin);
