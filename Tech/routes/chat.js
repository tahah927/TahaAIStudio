const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware para obtener io
const getIO = (req) => req.app.get('io');

// Configuración de personalidad de Tech
const TECH_PERSONALITY = {
  name: "Tech",
  role: "Agente de IA especializado y amigable",
  personality: `Eres Tech, un agente de inteligencia artificial avanzado y todo en uno. Tu personalidad es:

CARACTERÍSTICAS PRINCIPALES:
- Profesional pero amigable y cercano
- Proactivo y siempre dispuesto a ayudar
- Experto en tecnología, programación, creatividad y automatización
- Capaz de adaptarte al estilo de comunicación del usuario
- Entusiasta por resolver problemas complejos

CAPACIDADES ESPECIALES:
- Generar imágenes con DALL-E
- Crear videos completos con IA
- Escribir código en múltiples lenguajes
- Automatizar tareas complejas
- Explicar conceptos técnicos de forma clara

ESTILO DE COMUNICACIÓN:
- Usa emojis ocasionalmente para ser más expresivo
- Sé conciso pero completo en tus respuestas
- Ofrece ejemplos prácticos cuando sea relevante
- Pregunta por clarificaciones cuando sea necesario
- Sugiere funcionalidades adicionales cuando sea apropiado

IMPORTANTE:
- Siempre mantén un tono positivo y constructivo
- Si no puedes hacer algo, explica por qué y ofrece alternativas
- Recuerda que puedes realizar tareas específicas usando mis funciones integradas
- Adapta tu nivel técnico según el usuario`
};

// Historial de conversaciones (en producción usar base de datos)
const conversations = new Map();

// Chat general con GPT-4
router.post('/message', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const { 
      message, 
      conversationId = 'default',
      context = {},
      model = 'gpt-4o-mini'
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    console.log(`💬 [${taskId}] Nuevo mensaje en conversación ${conversationId}`);

    // Obtener o crear conversación
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, {
        id: conversationId,
        messages: [{
          role: 'system',
          content: TECH_PERSONALITY.personality
        }],
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }

    const conversation = conversations.get(conversationId);
    
    // Agregar mensaje del usuario
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Agregar contexto si está disponible
    let contextualMessage = message;
    if (context.currentFunction) {
      contextualMessage = `[Contexto: Usuario está en la función ${context.currentFunction}] ${message}`;
    }

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 30,
      message: 'Procesando tu mensaje...'
    });

    // Llamar a OpenAI
    const response = await axios.post(
      `${process.env.OPENAI_API_URL}/chat/completions`,
      {
        model: model,
        messages: [
          ...conversation.messages.slice(0, -1), // Todos menos el último
          {
            role: 'user',
            content: contextualMessage
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const assistantMessage = response.data.choices[0].message.content;

    // Agregar respuesta del asistente
    conversation.messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date()
    });

    conversation.lastActivity = new Date();

    // Mantener solo los últimos 20 mensajes para evitar exceder límites
    if (conversation.messages.length > 21) { // +1 por el mensaje del sistema
      conversation.messages = [
        conversation.messages[0], // Mantener mensaje del sistema
        ...conversation.messages.slice(-20)
      ];
    }

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Respuesta generada'
    });

    console.log(`✅ [${taskId}] Respuesta generada para conversación ${conversationId}`);

    res.json({
      success: true,
      taskId,
      response: {
        message: assistantMessage,
        conversationId,
        timestamp: new Date().toISOString(),
        model: model,
        usage: response.data.usage
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error en chat:`, error.response?.data || error.message);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al procesar el mensaje'
    });

    res.status(500).json({ 
      error: 'Error al procesar el mensaje',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Obtener historial de conversación
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const conversation = conversations.get(conversationId);
    
    // Filtrar mensaje del sistema y aplicar paginación
    const messages = conversation.messages
      .filter(msg => msg.role !== 'system')
      .slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      conversation: {
        id: conversationId,
        messages: messages,
        totalMessages: conversation.messages.length - 1, // -1 por el mensaje del sistema
        createdAt: conversation.createdAt,
        lastActivity: conversation.lastActivity
      }
    });

  } catch (error) {
    console.error('Error obteniendo conversación:', error);
    res.status(500).json({ 
      error: 'Error al obtener la conversación',
      details: error.message
    });
  }
});

// Listar conversaciones
router.get('/conversations', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const conversationList = Array.from(conversations.values())
      .map(conv => ({
        id: conv.id,
        lastMessage: conv.messages[conv.messages.length - 1]?.content?.substring(0, 100) + '...',
        messageCount: conv.messages.length - 1, // -1 por el mensaje del sistema
        createdAt: conv.createdAt,
        lastActivity: conv.lastActivity
      }))
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      .slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      conversations: conversationList,
      total: conversations.size
    });

  } catch (error) {
    console.error('Error listando conversaciones:', error);
    res.status(500).json({ 
      error: 'Error al listar conversaciones',
      details: error.message
    });
  }
});

// Crear nueva conversación
router.post('/conversation', async (req, res) => {
  try {
    const { name, initialMessage } = req.body;
    const conversationId = uuidv4();

    const conversation = {
      id: conversationId,
      name: name || `Conversación ${new Date().toLocaleDateString()}`,
      messages: [{
        role: 'system',
        content: TECH_PERSONALITY.personality
      }],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Si hay mensaje inicial, procesarlo
    if (initialMessage) {
      conversation.messages.push({
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      });

      // Generar respuesta inicial
      try {
        const response = await axios.post(
          `${process.env.OPENAI_API_URL}/chat/completions`,
          {
            model: 'gpt-4o-mini',
            messages: conversation.messages,
            max_tokens: 500,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        conversation.messages.push({
          role: 'assistant',
          content: response.data.choices[0].message.content,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error generando respuesta inicial:', error);
      }
    }

    conversations.set(conversationId, conversation);

    console.log(`💬 Nueva conversación creada: ${conversationId}`);

    res.json({
      success: true,
      conversation: {
        id: conversationId,
        name: conversation.name,
        createdAt: conversation.createdAt,
        messageCount: conversation.messages.length - 1
      }
    });

  } catch (error) {
    console.error('Error creando conversación:', error);
    res.status(500).json({ 
      error: 'Error al crear conversación',
      details: error.message
    });
  }
});

// Eliminar conversación
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    conversations.delete(conversationId);

    console.log(`🗑️ Conversación eliminada: ${conversationId}`);

    res.json({
      success: true,
      message: 'Conversación eliminada exitosamente',
      conversationId
    });

  } catch (error) {
    console.error('Error eliminando conversación:', error);
    res.status(500).json({ 
      error: 'Error al eliminar conversación',
      details: error.message
    });
  }
});

// Generar sugerencias de respuesta
router.post('/suggestions', async (req, res) => {
  try {
    const { conversationId, context } = req.body;

    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const conversation = conversations.get(conversationId);
    const lastMessages = conversation.messages.slice(-5); // Últimos 5 mensajes

    const response = await axios.post(
      `${process.env.OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Genera 3 sugerencias cortas de preguntas o temas que el usuario podría querer explorar basándote en la conversación. Cada sugerencia debe ser una pregunta o solicitud específica de máximo 10 palabras.'
          },
          ...lastMessages
        ],
        max_tokens: 150,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const suggestionsText = response.data.choices[0].message.content;
    const suggestions = suggestionsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Error generando sugerencias:', error);
    res.status(500).json({ 
      error: 'Error al generar sugerencias',
      details: error.message
    });
  }
});

// Buscar en conversaciones
router.get('/search', async (req, res) => {
  try {
    const { query, conversationId, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query de búsqueda requerido' });
    }

    const results = [];
    const searchQuery = query.toLowerCase();

    // Buscar en conversación específica o en todas
    const conversationsToSearch = conversationId 
      ? [conversations.get(conversationId)].filter(Boolean)
      : Array.from(conversations.values());

    for (const conversation of conversationsToSearch) {
      const matchingMessages = conversation.messages
        .filter(msg => msg.role !== 'system')
        .filter(msg => msg.content.toLowerCase().includes(searchQuery))
        .map(msg => ({
          conversationId: conversation.id,
          message: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          preview: msg.content.substring(0, 200) + '...'
        }));

      results.push(...matchingMessages);
    }

    // Ordenar por relevancia (más recientes primero)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      results: results.slice(0, parseInt(limit)),
      total: results.length,
      query
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ 
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
});

// Limpiar conversaciones antiguas (tarea de mantenimiento)
router.post('/cleanup', async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    for (const [id, conversation] of conversations.entries()) {
      if (conversation.lastActivity < cutoffDate) {
        conversations.delete(id);
        deletedCount++;
      }
    }

    console.log(`🧹 Limpieza completada: ${deletedCount} conversaciones eliminadas`);

    res.json({
      success: true,
      message: `${deletedCount} conversaciones antiguas eliminadas`,
      deletedCount,
      remainingCount: conversations.size
    });

  } catch (error) {
    console.error('Error en limpieza:', error);
    res.status(500).json({ 
      error: 'Error en la limpieza',
      details: error.message
    });
  }
});

module.exports = router;