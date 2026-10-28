import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createApp } from '../app';
import { repository } from '../database/repository';
import { AutomationEngineService } from '../modules/automations/automation.service';

const app = createApp();

describe('Sprint 2 - Onda 4 (#35 BE-15.2 & #36 FE-15.3): Engine de Automação "Se / Então" e Editor Visual/JSON', () => {
  const docsHtmlPath = path.resolve(__dirname, '../../../docs/index.html');
  const mobileDemoPath = path.resolve(__dirname, '../../../mobile/demo.html');
  const mobileWwwPath = path.resolve(__dirname, '../../../mobile/www/index.html');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(docsHtmlPath, 'utf-8');
  });

  beforeEach(() => {
    repository.seedInitialData();
    AutomationEngineService.clearExecutionLogs();
  });

  it('#35 (BE-15.2): deve listar regras de automação existentes e criar novas regras JSON válidas via /api/v1/automations', async () => {
    const listRes = await request(app).get('/api/v1/automations');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    const createRes = await request(app).post('/api/v1/automations').send({
      projectId: 'proj-sinergia-001',
      name: 'Se Status CONCLUÍDA ➔ Adicionar Tag Auditada',
      trigger: 'STATUS_CHANGED',
      conditions: { field: 'status', operator: 'EQUALS', value: 'COMPLETED' },
      actions: [{ action: 'ADD_TAG', targetValue: 'Auditada' }]
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.id).toBeDefined();
    expect(createRes.body.data.trigger).toBe('STATUS_CHANGED');
  });

  it('#35 (BE-15.2): deve disparar automaticamente a regra TASK_CREATED quando uma tarefa URGENT é criada e registrar no log de execução', async () => {
    const taskRes = await request(app).post('/api/v1/tasks').send({
      title: 'Hotfix Crítico em Produção',
      priority: 'URGENT',
      effortHours: 3,
      projectId: 'proj-sinergia-001',
      assigneeId: 'user-davi-001'
    });
    expect(taskRes.status).toBe(201);

    const logs = AutomationEngineService.getExecutionLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].trigger).toBe('TASK_CREATED');
    expect(logs[0].taskTitle).toBe('Hotfix Crítico em Produção');
    expect(logs[0].actionsExecuted[0]).toContain('SEND_NOTIFICATION');
  });

  it('#35 (BE-15.2): deve disparar a regra STATUS_CHANGED e executar ações (ADD_TAG / CHANGE_PRIORITY) ao atualizar uma tarefa', async () => {
    // Cria regra que adiciona tag 'Verificada' quando status muda para COMPLETED
    await request(app).post('/api/v1/automations').send({
      projectId: 'proj-sinergia-001',
      name: 'Auto-Tag ao Concluir',
      trigger: 'STATUS_CHANGED',
      conditions: { field: 'status', operator: 'EQUALS', value: 'COMPLETED' },
      actions: [{ action: 'ADD_TAG', targetValue: 'Verificada' }]
    });

    const createdTask = await request(app).post('/api/v1/tasks').send({
      title: 'Tarefa de Auditoria Automatizada',
      priority: 'HIGH',
      effortHours: 4,
      projectId: 'proj-sinergia-001'
    });
    const taskId = createdTask.body.data.id;

    const updateRes = await request(app).put(`/api/v1/tasks/${taskId}`).send({
      version: 1,
      status: 'COMPLETED'
    });
    expect(updateRes.status).toBe(200);
    const tagNames = (updateRes.body.data.tags || []).map((t: any) => t.name);
    expect(tagNames).toContain('Verificada');
  });

  it('#35 (BE-15.2): deve permitir ativar/pausar (PATCH /toggle) e excluir (DELETE) uma regra de automação', async () => {
    const toggleRes = await request(app)
      .patch('/api/v1/automations/auto-001/toggle')
      .send({ isActive: false });
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.isActive).toBe(false);

    const delRes = await request(app).delete('/api/v1/automations/auto-001');
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('#36 (FE-15.3): deve conter o Modal de Automações com Editor Visual "Se / Então", Preview JSON e Presets sincronizado nos 3 arquivos HTML', () => {
    expect(htmlContent).toContain('id="modalAutomations"');
    expect(htmlContent).toContain('openAutomationsModal()');
    expect(htmlContent).toContain('id="autoRuleTriggerSelect"');
    expect(htmlContent).toContain('id="autoCondFieldSelect"');
    expect(htmlContent).toContain('id="autoActionTypeSelect"');
    expect(htmlContent).toContain('id="autoRuleJsonPreviewBox"');
    expect(htmlContent).toContain('function handleSaveAutomationRuleUI()');
    expect(htmlContent).toContain('function evaluateLocalAutomations(');

    const demoHtml = fs.readFileSync(mobileDemoPath, 'utf-8');
    const wwwHtml = fs.readFileSync(mobileWwwPath, 'utf-8');
    expect(demoHtml.length).toBe(htmlContent.length);
    expect(wwwHtml.length).toBe(htmlContent.length);
  });
});
