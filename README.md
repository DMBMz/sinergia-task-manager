# 📱 Sinergia Task Manager — Sprint 1

> Plataforma inteligente de gestão e compartilhamento de tarefas com alocação distribuída, sincronização offline-first e colaboração em tempo real.  
> **Desenvolvido com:** React Native (Android) + Node.js (TypeScript) + PostgreSQL / Prisma + MinIO + Firebase Cloud Messaging (FCM).

---

## 🎯 Escopo Entregue na Sprint 1 (44 Story Points)

Todas as **7 User Stories** da Sprint 1 foram implementadas, estruturadas e validadas:

| US | Prioridade | SP | Descrição | Implementação |
| :--- | :---: | :---: | :--- | :--- |
| **US01** | Alta | 5.0 | Criar tarefas com esforço, datas e aninhamento de subtarefas | `backend/src/modules/tasks/`, `mobile/src/components/SubtaskTree.tsx` |
| **US02** | Alta | 13.0 | Funcionamento offline com banco local e sincronização automática | `mobile/src/services/syncService.ts`, `backend/src/modules/sync/` |
| **US03** | Alta | 5.0 | Convidar membros via QR/Link com diferentes permissões (ACL) | `backend/src/modules/invites/`, `mobile/src/components/ShareModal.tsx`, `QRScannerModal.tsx` |
| **US04** | Alta | 8.0 | Comentários com `@` e anexos via MinIO | `backend/src/modules/storage/`, `backend/src/modules/comments/`, `mobile/src/components/CommentSection.tsx` |
| **US05** | Alta | 5.0 | Filtro por tags e busca semântica/fuzzy tolerante a erros | `mobile/src/services/searchIndex.ts`, `mobile/src/components/FilterBar.tsx` |
| **US06** | Alta | 5.0 | Bloqueio de edições simultâneas via Lock Otimista | `backend/src/modules/tasks/tasks.controller.ts`, `mobile/src/components/ConflictModal.tsx` |
| **US07** | Alta | 3.0 | Alertas contextuais e progressivos de prazo via Firebase | `backend/src/modules/notifications/`, `mobile/src/services/notificationHandler.ts` |

---

## 📂 Estrutura do Projeto

```
c:\Users\Davi\Downloads\Sinergia\
├── backend/
│   ├── prisma/
│   │   └── schema.prisma            # Schema relacional (DB-01.1, BE-06.1)
│   ├── src/
│   │   ├── database/                # Repository em memória / Prisma com delta changelog
│   │   ├── modules/
│   │   │   ├── tasks/               # CRUD de tarefas, subtarefas e Lock Otimista (US01, US06)
│   │   │   ├── sync/                # Endpoints /pull e /push do WatermelonDB (US02)
│   │   │   ├── invites/             # Geração de tokens temporários QR/Link com ACL (US03)
│   │   │   ├── comments/            # Chat com menções @ e notificações (US04)
│   │   │   ├── storage/             # Integração MinIO para upload/download de arquivos (US04)
│   │   │   └── notifications/       # Alertas progressivos FCM (7d, 3d, 1d, 1h) (US07)
│   │   ├── __tests__/
│   │   │   └── sprint1.spec.ts      # Suite automatizada cobrindo todas as US
│   │   ├── app.ts                   # Montagem das rotas Express
│   │   └── server.ts                # Inicialização do servidor na porta 3000
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   ├── src/
│   │   ├── database/
│   │   │   └── schema.ts            # Schema local WatermelonDB (FE-02.1)
│   │   ├── services/
│   │   │   ├── syncService.ts       # Delta Sync bidirecional offline-first (FE-02.1)
│   │   │   ├── searchIndex.ts       # Índice invertido & busca difusa Levenshtein (US05)
│   │   │   └── notificationHandler.ts # Handler de background FCM com cores de urgência (US07)
│   │   ├── components/
│   │   │   ├── SubtaskTree.tsx      # Hierarquia e progresso de subtarefas (US01)
│   │   │   ├── CommentSection.tsx   # Chat com menções @ e anexos MinIO (US04)
│   │   │   ├── ShareModal.tsx       # Gerador dinâmico de QR Code com ACL (US03)
│   │   │   ├── QRScannerModal.tsx   # Leitor de QR Code para novos membros (US03)
│   │   │   ├── ConflictModal.tsx    # Modal com diff visual de Lock Otimista (US06)
│   │   │   ├── FilterBar.tsx        # Filtros de tags, status, prioridade e rede (US05)
│   │   │   └── TaskCard.tsx         # Card com prazos progressivos e subtarefas
│   │   ├── screens/
│   │   │   ├── TasksScreen.tsx      # Lista principal de tarefas
│   │   │   ├── TaskDetailScreen.tsx # Visualização completa da tarefa
│   │   │   └── TaskFormScreen.tsx   # Criação/Edição com trava de versão
│   │   ├── __tests__/
│   │   │   └── mobileSprint1.spec.ts # Testes unitários do mobile
│   │   └── App.tsx                  # Componente raiz reativo
│   ├── demo.html                    # Showcase interativo em simulador Android
│   └── package.json
├── docs/
│   ├── BackLog Davi.xlsx            # Backlog original do projeto
│   └── tema-mobile-davi.pdf         # Especificação de requisitos e arquitetura
└── docker-compose.yml               # PostgreSQL e MinIO locais
```

---

## 🚀 Como Executar

### 1. Backend (API Node.js)
```bash
cd backend
npm install
npm test       # Executa a suíte de testes de todas as US
npm run dev    # Inicia o servidor na porta 3000
```

### 2. Mobile (Demonstração Interativa Instantânea)
Abra o arquivo `mobile/demo.html` diretamente em qualquer navegador para testar interativamente:
- Criação e aninhamento de subtarefas.
- Alternância instantânea de modo Online / Offline com simulação de sincronização delta.
- Leitura e geração de QR Code com permissões.
- Chat com menções `@` e arquivos anexados.
- Busca semântica tolerante a erros de digitação (Fuzzy Search).
- Simulação de conflito de Lock Otimista com resolução visual.
