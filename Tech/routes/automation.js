const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

const router = express.Router();

// Middleware para obtener io
const getIO = (req) => req.app.get('io');

// Almacén de automatizaciones activas (en producción usar base de datos)
const activeAutomations = new Map();
const automationHistory = new Map();

// Configuración de Tech para automatización
const TECH_AUTOMATION_PERSONALITY = `Eres Tech, un experto en automatización y integración de sistemas. Tu especialidad es:

CAPACIDADES DE AUTOMATIZACIÓN:
- Integración de APIs (REST, GraphQL, WebHooks)
- Automatización de tareas repetitivas
- Workflows complejos con múltiples pasos
- Monitoreo y alertas
- Procesamiento de datos
- Integración con servicios populares (Zapier, n8n, IFTTT)

TIPOS DE AUTOMATIZACIÓN:
- Programadas (cron jobs)
- Basadas en eventos (webhooks, triggers)
- Condicionales (if-then-else)
- Secuenciales (paso a paso)
- Paralelas (múltiples tareas simultáneas)

SERVICIOS COMPATIBLES:
- Email (Gmail, Outlook, SendGrid)
- Almacenamiento (Google Drive, Dropbox, AWS S3)
- Comunicación (Slack, Discord, Teams)
- Redes sociales (Twitter, LinkedIn, Facebook)
- Bases de datos (MySQL, PostgreSQL, MongoDB)
- APIs personalizadas

Siempre proporciona automatizaciones robustas con manejo de errores y logging.`;

// Crear nueva automatización
router.post('/create', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const {
      name,
      description,
      trigger, // cron, webhook, manual
      actions, // array de acciones a ejecutar
      schedule, // para trigger cron
      webhookUrl, // para trigger webhook
      enabled = true
    } = req.body;

    if (!name || !description || !trigger || !actions) {
      return res.status(400).json({ 
        error: 'Nombre, descripción, trigger y acciones son requeridos' 
      });
    }

    console.log(`🔁 [${taskId}] Creando automatización: "${name}"`);

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 20,
      message: 'Validando configuración...'
    });

    // Validar configuración según el tipo de trigger
    if (trigger === 'cron' && !schedule) {
      return res.status(400).json({ error: 'Schedule es requerido para trigger cron' });
    }

    if (trigger === 'webhook' && !webhookUrl) {
      return res.status(400).json({ error: 'WebhookUrl es requerido para trigger webhook' });
    }

    // Validar formato de schedule si es cron
    if (trigger === 'cron' && !cron.validate(schedule)) {
      return res.status(400).json({ error: 'Formato de schedule inválido' });
    }

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 50,
      message: 'Configurando automatización...'
    });

    const automation = {
      id: taskId,
      name,
      description,
      trigger,
      actions,
      schedule,
      webhookUrl,
      enabled,
      createdAt: new Date(),
      lastRun: null,
      runCount: 0,
      status: 'active'
    };

    // Configurar trigger según el tipo
    if (trigger === 'cron' && enabled) {
      const cronJob = cron.schedule(schedule, () => {
        executeAutomation(taskId);
      }, {
        scheduled: false
      });
      
      automation.cronJob = cronJob;
      cronJob.start();
    }

    activeAutomations.set(taskId, automation);

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Automatización creada exitosamente'
    });

    console.log(`✅ [${taskId}] Automatización creada: ${name}`);

    res.json({
      success: true,
      taskId,
      automation: {
        id: automation.id,
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        schedule: automation.schedule,
        webhookUrl: automation.webhookUrl,
        enabled: automation.enabled,
        status: automation.status,
        createdAt: automation.createdAt,
        actionsCount: actions.length
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error creando automatización:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al crear la automatización'
    });

    res.status(500).json({ 
      error: 'Error al crear la automatización',
      details: error.message,
      taskId
    });
  }
});

// Generar automatización con IA
router.post('/generate', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const {
      description,
      services = [], // servicios a integrar
      frequency = 'daily' // hourly, daily, weekly, monthly
    } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'La descripción de la automatización es requerida' });
    }

    console.log(`🤖 [${taskId}] Generando automatización: "${description}"`);

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 30,
      message: 'Analizando requerimientos...'
    });

    const prompt = `${TECH_AUTOMATION_PERSONALITY}

DESCRIPCIÓN DE LA AUTOMATIZACIÓN: ${description}
SERVICIOS A INTEGRAR: ${services.join(', ') || 'cualquier servicio relevante'}
FRECUENCIA DESEADA: ${frequency}

Genera una configuración completa de automatización que incluya:

1. NOMBRE: Un nombre descriptivo para la automatización
2. TRIGGER: Tipo de disparador (cron, webhook, manual) con configuración
3. ACCIONES: Lista detallada de pasos a ejecutar
4. CONFIGURACIÓN: Parámetros necesarios para cada acción
5. MANEJO DE ERRORES: Qué hacer si algo falla
6. LOGGING: Qué información registrar

Formato de respuesta en JSON:
{
  "name": "Nombre de la automatización",
  "description": "Descripción detallada",
  "trigger": "cron|webhook|manual",
  "schedule": "expresión cron si aplica",
  "actions": [
    {
      "type": "api_call|email|file_operation|data_processing",
      "name": "Nombre de la acción",
      "config": {
        "url": "URL si es API",
        "method": "GET|POST|PUT|DELETE",
        "headers": {},
        "body": {},
        "params": {}
      },
      "onError": "continue|stop|retry",
      "retries": 3
    }
  ],
  "notifications": {
    "onSuccess": true,
    "onError": true,
    "channels": ["email", "slack"]
  }
}`;

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 60,
      message: 'Generando configuración con IA...'
    });

    const response = await axios.post(
      `${process.env.OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 1500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedConfig = response.data.choices[0].message.content;

    // Intentar parsear JSON de la respuesta
    let automationConfig;
    try {
      const jsonMatch = generatedConfig.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        automationConfig = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    } catch (parseError) {
      console.error('Error parseando configuración generada:', parseError);
      automationConfig = {
        name: `Automatización ${taskId}`,
        description: description,
        trigger: 'manual',
        actions: [{
          type: 'custom',
          name: 'Acción personalizada',
          config: { description: generatedConfig }
        }]
      };
    }

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Automatización generada exitosamente'
    });

    res.json({
      success: true,
      taskId,
      automation: {
        id: taskId,
        generated: true,
        rawResponse: generatedConfig,
        config: automationConfig,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error generando automatización:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al generar la automatización'
    });

    res.status(500).json({ 
      error: 'Error al generar la automatización',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Ejecutar automatización manualmente
router.post('/:automationId/execute', async (req, res) => {
  const { automationId } = req.params;
  const executionId = uuidv4();
  
  try {
    if (!activeAutomations.has(automationId)) {
      return res.status(404).json({ error: 'Automatización no encontrada' });
    }

    console.log(`▶️ [${executionId}] Ejecutando automatización: ${automationId}`);

    // Ejecutar en background
    executeAutomation(automationId, executionId);

    res.json({
      success: true,
      executionId,
      message: 'Automatización iniciada',
      automationId
    });

  } catch (error) {
    console.error(`❌ Error ejecutando automatización ${automationId}:`, error);
    res.status(500).json({ 
      error: 'Error al ejecutar la automatización',
      details: error.message
    });
  }
});

// Función para ejecutar automatización
async function executeAutomation(automationId, executionId = uuidv4()) {
  const automation = activeAutomations.get(automationId);
  if (!automation) {
    console.error(`❌ Automatización ${automationId} no encontrada`);
    return;
  }

  const execution = {
    id: executionId,
    automationId,
    startTime: new Date(),
    status: 'running',
    results: [],
    errors: []
  };

  try {
    console.log(`🔄 [${executionId}] Iniciando ejecución de: ${automation.name}`);

    // Actualizar estadísticas
    automation.lastRun = new Date();
    automation.runCount++;

    // Ejecutar cada acción
    for (let i = 0; i < automation.actions.length; i++) {
      const action = automation.actions[i];
      
      try {
        console.log(`📋 [${executionId}] Ejecutando acción ${i + 1}: ${action.name}`);
        
        const result = await executeAction(action, executionId);
        execution.results.push({
          actionIndex: i,
          actionName: action.name,
          success: true,
          result: result,
          timestamp: new Date()
        });

      } catch (actionError) {
        console.error(`❌ [${executionId}] Error en acción ${i + 1}:`, actionError);
        
        execution.errors.push({
          actionIndex: i,
          actionName: action.name,
          error: actionError.message,
          timestamp: new Date()
        });

        // Manejar error según configuración
        if (action.onError === 'stop') {
          break;
        } else if (action.onError === 'retry' && action.retries > 0) {
          // Implementar lógica de retry
          console.log(`🔄 [${executionId}] Reintentando acción ${i + 1}...`);
          // TODO: Implementar retry logic
        }
      }
    }

    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    execution.status = execution.errors.length > 0 ? 'completed_with_errors' : 'completed';

    console.log(`✅ [${executionId}] Ejecución completada en ${execution.duration}ms`);

  } catch (error) {
    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    execution.status = 'failed';
    execution.errors.push({
      error: error.message,
      timestamp: new Date()
    });

    console.error(`❌ [${executionId}] Ejecución fallida:`, error);
  }

  // Guardar historial
  if (!automationHistory.has(automationId)) {
    automationHistory.set(automationId, []);
  }
  automationHistory.get(automationId).push(execution);

  // Mantener solo las últimas 100 ejecuciones
  const history = automationHistory.get(automationId);
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
}

// Función para ejecutar una acción específica
async function executeAction(action, executionId) {
  switch (action.type) {
    case 'api_call':
      return await executeApiCall(action, executionId);
    case 'email':
      return await executeEmail(action, executionId);
    case 'file_operation':
      return await executeFileOperation(action, executionId);
    case 'data_processing':
      return await executeDataProcessing(action, executionId);
    case 'delay':
      return await executeDelay(action, executionId);
    default:
      throw new Error(`Tipo de acción no soportado: ${action.type}`);
  }
}

// Implementaciones de tipos de acciones
async function executeApiCall(action, executionId) {
  const { config } = action;
  
  console.log(`🌐 [${executionId}] API Call: ${config.method} ${config.url}`);
  
  const response = await axios({
    method: config.method || 'GET',
    url: config.url,
    headers: config.headers || {},
    data: config.body,
    params: config.params,
    timeout: config.timeout || 30000
  });

  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    headers: response.headers
  };
}

async function executeEmail(action, executionId) {
  const { config } = action;
  
  console.log(`📧 [${executionId}] Enviando email a: ${config.to}`);
  
  // TODO: Implementar envío de email real
  // Por ahora simular
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    to: config.to,
    subject: config.subject,
    sent: true,
    timestamp: new Date()
  };
}

async function executeFileOperation(action, executionId) {
  const { config } = action;
  
  console.log(`📁 [${executionId}] Operación de archivo: ${config.operation}`);
  
  switch (config.operation) {
    case 'read':
      const content = await fs.readFile(config.path, 'utf8');
      return { content, size: content.length };
    
    case 'write':
      await fs.writeFile(config.path, config.content);
      return { written: true, path: config.path };
    
    case 'copy':
      await fs.copy(config.source, config.destination);
      return { copied: true, from: config.source, to: config.destination };
    
    case 'delete':
      await fs.remove(config.path);
      return { deleted: true, path: config.path };
    
    default:
      throw new Error(`Operación de archivo no soportada: ${config.operation}`);
  }
}

async function executeDataProcessing(action, executionId) {
  const { config } = action;
  
  console.log(`⚙️ [${executionId}] Procesamiento de datos: ${config.operation}`);
  
  // TODO: Implementar operaciones de procesamiento de datos
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    operation: config.operation,
    processed: true,
    timestamp: new Date()
  };
}

async function executeDelay(action, executionId) {
  const { config } = action;
  const delay = config.duration || 1000;
  
  console.log(`⏱️ [${executionId}] Esperando ${delay}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return { delayed: delay };
}

// Obtener automatización
router.get('/:automationId', async (req, res) => {
  try {
    const { automationId } = req.params;
    
    if (!activeAutomations.has(automationId)) {
      return res.status(404).json({ error: 'Automatización no encontrada' });
    }

    const automation = activeAutomations.get(automationId);
    const history = automationHistory.get(automationId) || [];

    res.json({
      success: true,
      automation: {
        id: automation.id,
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        schedule: automation.schedule,
        webhookUrl: automation.webhookUrl,
        enabled: automation.enabled,
        status: automation.status,
        createdAt: automation.createdAt,
        lastRun: automation.lastRun,
        runCount: automation.runCount,
        actionsCount: automation.actions.length,
        recentExecutions: history.slice(-5)
      }
    });

  } catch (error) {
    console.error('Error obteniendo automatización:', error);
    res.status(500).json({ 
      error: 'Error al obtener la automatización',
      details: error.message
    });
  }
});

// Listar automatizaciones
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, trigger } = req.query;
    
    let automations = Array.from(activeAutomations.values());
    
    // Filtrar por status si se especifica
    if (status) {
      automations = automations.filter(auto => auto.status === status);
    }
    
    // Filtrar por trigger si se especifica
    if (trigger) {
      automations = automations.filter(auto => auto.trigger === trigger);
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    automations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginar
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAutomations = automations.slice(startIndex, endIndex);
    
    const automationList = paginatedAutomations.map(auto => ({
      id: auto.id,
      name: auto.name,
      description: auto.description,
      trigger: auto.trigger,
      enabled: auto.enabled,
      status: auto.status,
      createdAt: auto.createdAt,
      lastRun: auto.lastRun,
      runCount: auto.runCount,
      actionsCount: auto.actions.length
    }));
    
    res.json({
      success: true,
      automations: automationList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: automations.length,
        pages: Math.ceil(automations.length / limit)
      }
    });

  } catch (error) {
    console.error('Error listando automatizaciones:', error);
    res.status(500).json({ 
      error: 'Error al listar automatizaciones',
      details: error.message
    });
  }
});

// Actualizar automatización
router.put('/:automationId', async (req, res) => {
  try {
    const { automationId } = req.params;
    const updates = req.body;
    
    if (!activeAutomations.has(automationId)) {
      return res.status(404).json({ error: 'Automatización no encontrada' });
    }

    const automation = activeAutomations.get(automationId);
    
    // Detener cron job si existe
    if (automation.cronJob) {
      automation.cronJob.stop();
    }
    
    // Aplicar actualizaciones
    Object.assign(automation, updates, { updatedAt: new Date() });
    
    // Reiniciar cron job si es necesario
    if (automation.trigger === 'cron' && automation.enabled && automation.schedule) {
      const cronJob = cron.schedule(automation.schedule, () => {
        executeAutomation(automationId);
      }, {
        scheduled: false
      });
      
      automation.cronJob = cronJob;
      cronJob.start();
    }
    
    console.log(`📝 Automatización actualizada: ${automationId}`);

    res.json({
      success: true,
      message: 'Automatización actualizada exitosamente',
      automation: {
        id: automation.id,
        name: automation.name,
        enabled: automation.enabled,
        status: automation.status,
        updatedAt: automation.updatedAt
      }
    });

  } catch (error) {
    console.error('Error actualizando automatización:', error);
    res.status(500).json({ 
      error: 'Error al actualizar la automatización',
      details: error.message
    });
  }
});

// Eliminar automatización
router.delete('/:automationId', async (req, res) => {
  try {
    const { automationId } = req.params;
    
    if (!activeAutomations.has(automationId)) {
      return res.status(404).json({ error: 'Automatización no encontrada' });
    }

    const automation = activeAutomations.get(automationId);
    
    // Detener cron job si existe
    if (automation.cronJob) {
      automation.cronJob.stop();
    }
    
    // Eliminar de almacenes
    activeAutomations.delete(automationId);
    automationHistory.delete(automationId);
    
    console.log(`🗑️ Automatización eliminada: ${automationId}`);

    res.json({
      success: true,
      message: 'Automatización eliminada exitosamente',
      automationId
    });

  } catch (error) {
    console.error('Error eliminando automatización:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la automatización',
      details: error.message
    });
  }
});

// Obtener historial de ejecuciones
router.get('/:automationId/history', async (req, res) => {
  try {
    const { automationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    if (!automationHistory.has(automationId)) {
      return res.json({
        success: true,
        history: [],
        pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 }
      });
    }

    const history = automationHistory.get(automationId);
    
    // Ordenar por fecha (más recientes primero)
    const sortedHistory = [...history].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    // Paginar
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = sortedHistory.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      history: paginatedHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length,
        pages: Math.ceil(history.length / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ 
      error: 'Error al obtener el historial',
      details: error.message
    });
  }
});

module.exports = router;