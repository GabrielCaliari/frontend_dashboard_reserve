### Task 24: Domínio `reports`

**Files:**
- Create: `src/modules/reports/infrastructure/adapters.ts`
- Move: `src/common/hooks/reports/use-reports.ts` → `src/shared/hooks/reports/use-reports.ts`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Analytics Reports">`
- Produces: `reportService` (mesmo shape hoje exportado por `report-service.ts`) sob novo caminho

- [ ] **Step 1: Inspecionar o serviço gerado**

```bash
ls src/infraestructure/server/services | grep -i analytics
cat src/infraestructure/server/services/analytics-reports/index.ts
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/report-service.ts
```

- [ ] **Step 3: Criar `src/modules/reports/infrastructure/adapters.ts`**

Porte o objeto `reportService` inteiro, preservando `list`, `create`, `update`, `delete`, delegando ao serviço gerado do Step 1.

- [ ] **Step 4: Mover o hook**

```bash
mkdir -p src/shared/hooks/reports
git mv src/common/hooks/reports/use-reports.ts src/shared/hooks/reports/use-reports.ts
```

- [ ] **Step 5: Apagar original e corrigir imports**

```bash
git rm src/common/services/report-service.ts
grep -rl '@/src/common/services/report-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/report-service|@/src/modules/reports/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/reports' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/reports|@/src/shared/hooks/reports|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- report
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(reports): migrate report-service.ts to modules/reports/infrastructure/"
```

---

