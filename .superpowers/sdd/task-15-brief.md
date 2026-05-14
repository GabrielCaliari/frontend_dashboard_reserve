### Task 15: Domínio `cms`

**Files:**
- Create: `src/modules/cms/infrastructure/adapters.ts`
- Move: `src/common/hooks/cms/*` → `src/shared/hooks/cms/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "CMS Article Management", "CMS Author Management", "CMS Blogs", "CMS Image Management", "CMS - Media Assets", "CMS - Media Collections", "CMS - Media Relations", "CMS Public API">`
- Produces: as funções de `cms-article-service.ts`, `cms-author-service.ts`, `cms-blog-service.ts`, `blog-service.ts`, `cms-image-service.ts`, `cms-media-service.ts`, `cms-public-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar os 7 serviços gerados**

```bash
ls src/infraestructure/server/services | grep -i cms
for s in cms-article-management cms-author-management cms-blogs cms-image-management cms-media-assets cms-media-collections cms-media-relations cms-public-api; do
  echo "--- $s"; cat "src/infraestructure/server/services/$s/index.ts"
done
```

- [ ] **Step 2: Ler os 7 arquivos originais**

```bash
for f in cms-article-service cms-author-service cms-blog-service blog-service cms-image-service cms-media-service cms-public-service; do
  echo "--- $f"; cat "src/common/services/$f.ts"
done
```

- [ ] **Step 3: Criar `src/modules/cms/infrastructure/adapters.ts`**

Porte cada função encontrada no Step 2, preservando nome e assinatura, delegando ao serviço gerado correspondente do Step 1. Mantenha `cms-media-service.ts` e `cms-public-service.ts` como seções claramente separadas dentro do arquivo (ou, se o volume total ultrapassar ~400 linhas, separe em `adapters.ts` + `media-adapters.ts` + `public-adapters.ts` dentro da mesma pasta `infrastructure/`).

- [ ] **Step 4: Mover os hooks (preserva `index.ts` como barrel)**

```bash
mkdir -p src/shared/hooks/cms
git mv src/common/hooks/cms src/shared/hooks/cms 2>/dev/null || {
  for f in $(ls src/common/hooks/cms); do
    git mv "src/common/hooks/cms/$f" "src/shared/hooks/cms/$f"
  done
}
```

(Como `src/shared/hooks/cms` pode já ter sido criado vazio na Task 3, prefira mover arquivo a arquivo se o `git mv` de diretório falhar por a pasta destino já existir e não estar vazia.)

- [ ] **Step 5: Apagar originais e corrigir imports**

```bash
git rm src/common/services/cms-article-service.ts src/common/services/cms-author-service.ts \
  src/common/services/cms-blog-service.ts src/common/services/blog-service.ts \
  src/common/services/cms-image-service.ts src/common/services/cms-media-service.ts \
  src/common/services/cms-public-service.ts
git rm src/common/services/cms-article-service.test.ts src/common/services/cms-blog-service.test.ts \
  src/common/services/cms-public-service.test.ts 2>/dev/null || true
git rm -r src/common/services/__tests__ 2>/dev/null || true

grep -rl '@/src/common/services/cms-article-service\|@/src/common/services/cms-author-service\|@/src/common/services/cms-blog-service\|@/src/common/services/blog-service\|@/src/common/services/cms-image-service\|@/src/common/services/cms-media-service\|@/src/common/services/cms-public-service' src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E \
  's|@/src/common/services/(cms-article-service|cms-author-service|cms-blog-service|blog-service|cms-image-service|cms-media-service|cms-public-service)|@/src/modules/cms/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/cms' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/cms|@/src/shared/hooks/cms|g'
```

- [ ] **Step 6: Recriar os testes movidos**

Os testes `cms-article-service.test.ts`, `cms-blog-service.test.ts`, `cms-public-service.test.ts`, e a pasta `__tests__/cms-integration.test.ts` / `cms-property-tests.test.ts` precisam ser recriados em `src/modules/cms/infrastructure/__tests__/`, importando de `../adapters` em vez do arquivo antigo — copie o conteúdo de cada um antes de rodar o `git rm` do Step 5, ajustando apenas a linha de import.

- [ ] **Step 7: Build e teste**

```bash
npm run build
npm run test:run -- cms
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(cms): migrate hand-written services to modules/cms/infrastructure/"
```

---

