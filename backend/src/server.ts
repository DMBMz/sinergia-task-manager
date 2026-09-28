import { createApp } from './app';
import { config } from './config';
import { seedDatabase } from './database/seed';

const app = createApp();

seedDatabase().catch(e => console.warn('[Seed warning]', e));

app.listen(config.port, () => {
  console.log(`[Sinergia Backend] Servidor rodando com sucesso na porta ${config.port}`);
  console.log(`[Sinergia Backend] Endpoints ativos:`);
  console.log(`  - Tarefas (US01, US05, US06): http://localhost:${config.port}/api/v1/tasks`);
  console.log(`  - Offline Sync (US02):       http://localhost:${config.port}/api/v1/sync/pull`);
  console.log(`  - Convites QR/Link (US03):   http://localhost:${config.port}/api/v1/invites`);
  console.log(`  - Comentários/MinIO (US04):  http://localhost:${config.port}/api/v1/tasks/:id/comments`);
  console.log(`  - Alertas Prazos (US07):     http://localhost:${config.port}/api/v1/notifications/deadlines`);
});
