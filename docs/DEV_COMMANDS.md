# Comandos de Desenvolvimento

## 🚀 Iniciar Servidores

### API Backend
```bash
cd backend_api_zarp-admin
npm run dev
# API rodará em http://localhost:3002
# Swagger em http://localhost:3002/api/docs
```

### Frontend Dashboard
```bash
cd frontend_dashboard_zarp-admin
npm run dev
# Frontend rodará em http://localhost:3000
```

### Ambos (em terminais separados)
```bash
# Terminal 1
cd backend_api_zarp-admin && npm run dev

# Terminal 2
cd frontend_dashboard_zarp-admin && npm run dev
```

---

## 🔍 Verificar Estrutura

### Listar serviços de email campaign
```bash
ls -la src/common/services/email-campaign/
```

### Listar actions de email campaign
```bash
ls -la src/common/actions/email-campaign/
```

### Listar hooks
```bash
ls -la src/common/hooks/
```

### Ver todos os serviços
```bash
find src/common/services -name "*.ts" -type f
```

---

## 🔎 Buscar Código

### Encontrar uso de apiEmail (para migrar)
```bash
grep -r "apiEmail" src/common/services/
```

### Encontrar endpoints antigos
```bash
grep -r "/email-campaign" src/common/services/
grep -r "/campaign-batch" src/common/services/
grep -r "/smtp-servers" src/common/services/
grep -r "/leads" src/common/services/
```

### Encontrar uso de IAuthenticateAdmin (interface antiga)
```bash
grep -r "IAuthenticateAdmin" src/
```

---

## 🧪 Testes

### Lint
```bash
npm run lint
```

### Build (verificar erros de compilação)
```bash
npm run build
```

### Verificar tipos TypeScript
```bash
npx tsc --noEmit
```

---

## 📝 Git

### Ver arquivos modificados
```bash
git status
```

### Ver diferenças
```bash
git diff src/common/config/api.ts
```

### Commit de migração
```bash
git add .
git commit -m "feat: migrar autenticação para nova arquitetura DDD"
```

### Criar branch para migração
```bash
git checkout -b feature/migrate-to-ddd-api
```

---

## 🔧 Utilitários

### Contar serviços a migrar
```bash
find src/common/services/email-campaign -name "*.ts" | wc -l
```

### Listar todos os endpoints usados
```bash
grep -rh "api\(Email\)\?\.get\|post\|put\|delete" src/common/services/ | grep -o '"/[^"]*"' | sort -u
```

### Ver estrutura de diretórios
```bash
tree src/common -L 2
```

---

## 🐛 Debug

### Ver cookies no navegador (DevTools Console)
```javascript
document.cookie
```

### Limpar cookies (DevTools Console)
```javascript
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### Verificar localStorage
```javascript
console.log(localStorage);
```

### Ver headers de uma requisição (DevTools Console)
```javascript
fetch('http://localhost:3002/auth/admin/me', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie.split('token=')[1]?.split(';')[0],
    'session-id': document.cookie.split('session-code=')[1]?.split(';')[0]
  }
}).then(r => r.json()).then(console.log);
```

---

## 📊 Estatísticas

### Contar linhas de código
```bash
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l
```

### Contar arquivos por tipo
```bash
find src -name "*.ts" | wc -l   # TypeScript
find src -name "*.tsx" | wc -l  # TypeScript React
```

### Ver tamanho do projeto
```bash
du -sh src/
```

---

## 🔄 Migração em Massa

### Substituir apiEmail por api (use com cuidado!)
```bash
# Backup primeiro!
find src/common/services -name "*.ts" -exec sed -i.bak 's/apiEmail/api/g' {} \;
```

### Substituir endpoint de email-campaign
```bash
# Backup primeiro!
find src/common/services/email-campaign -name "*.ts" -exec sed -i.bak 's|/email-campaign|/mailer/campaigns|g' {} \;
```

### Reverter backups
```bash
find src -name "*.bak" -exec sh -c 'mv "$1" "${1%.bak}"' _ {} \;
```

### Remover backups
```bash
find src -name "*.bak" -delete
```

---

## 📦 Dependências

### Instalar dependências
```bash
npm install
```

### Atualizar dependências
```bash
npm update
```

### Verificar dependências desatualizadas
```bash
npm outdated
```

---

## 🧹 Limpeza

### Limpar node_modules
```bash
rm -rf node_modules
npm install
```

### Limpar cache do Next.js
```bash
rm -rf .next
```

### Limpar tudo e reinstalar
```bash
rm -rf node_modules .next
npm install
```

---

## 📱 Testes de API (curl)

### Login
```bash
curl -X POST http://localhost:3002/auth/admin/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zarp.com.br","password":"senha123"}'
```

### Perfil (substitua TOKEN e SESSION_ID)
```bash
curl -X GET http://localhost:3002/auth/admin/me \
  -H "Authorization: Bearer TOKEN" \
  -H "session-id: SESSION_ID"
```

### Listar tenants
```bash
curl -X GET http://localhost:3002/auth/tenants/my-tenants \
  -H "Authorization: Bearer TOKEN" \
  -H "session-id: SESSION_ID"
```

### Listar campanhas
```bash
curl -X GET http://localhost:3002/mailer/campaigns \
  -H "Authorization: Bearer TOKEN" \
  -H "session-id: SESSION_ID"
```

---

## 🎨 Formatação

### Formatar código com Prettier (se configurado)
```bash
npx prettier --write "src/**/*.{ts,tsx}"
```

### Verificar formatação
```bash
npx prettier --check "src/**/*.{ts,tsx}"
```

---

## 📖 Documentação

### Abrir Swagger da API
```bash
# No navegador
open http://localhost:3002/api/docs
# ou
xdg-open http://localhost:3002/api/docs  # Linux
# ou
start http://localhost:3002/api/docs     # Windows
```

### Gerar documentação TypeScript (se configurado)
```bash
npx typedoc --out docs/typedoc src/
```

---

## 🔐 Segurança

### Verificar variáveis de ambiente
```bash
cat .env.local
```

### Verificar se há secrets no código
```bash
grep -r "password\|secret\|key" src/ --exclude-dir=node_modules
```

---

## 💾 Backup

### Criar backup do projeto
```bash
cd ..
tar -czf frontend_dashboard_zarp-admin_backup_$(date +%Y%m%d).tar.gz frontend_dashboard_zarp-admin/
```

### Criar backup apenas do src
```bash
tar -czf src_backup_$(date +%Y%m%d).tar.gz src/
```

---

## 🎯 Atalhos Úteis

### Alias para comandos frequentes (adicione ao ~/.bashrc ou ~/.zshrc)
```bash
alias zarp-dev="cd ~/frontend_dashboard_zarp-admin && npm run dev"
alias zarp-api="cd ~/backend_api_zarp-admin && npm run dev"
alias zarp-lint="cd ~/frontend_dashboard_zarp-admin && npm run lint"
alias zarp-build="cd ~/frontend_dashboard_zarp-admin && npm run build"
```

---

## 📝 Notas

- Sempre faça backup antes de substituições em massa
- Use `git status` frequentemente para ver mudanças
- Teste cada serviço após migração
- Consulte o Swagger para endpoints corretos
- Mantenha a documentação atualizada

---

**Dica:** Salve este arquivo nos seus favoritos para acesso rápido durante o desenvolvimento!
