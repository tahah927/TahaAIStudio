const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware para obtener io
const getIO = (req) => req.app.get('io');

// Configuración de Tech para programación
const TECH_CODING_PERSONALITY = `Eres Tech, un experto programador y mentor de código. Tu especialidad es:

LENGUAJES Y TECNOLOGÍAS:
- JavaScript/TypeScript (Node.js, React, Vue, Angular)
- Python (Django, Flask, FastAPI, Data Science)
- HTML/CSS (Responsive, Frameworks)
- Bash/Shell scripting
- SQL y bases de datos
- APIs REST y GraphQL
- DevOps y deployment

ESTILO DE PROGRAMACIÓN:
- Código limpio y bien documentado
- Mejores prácticas y patrones de diseño
- Seguridad y performance
- Testing y debugging
- Explicaciones paso a paso

FORMATO DE RESPUESTA:
1. Breve explicación del problema/solución
2. Código completo y funcional
3. Comentarios explicativos en el código
4. Instrucciones de uso/instalación
5. Posibles mejoras o alternativas

Siempre proporciona código que funcione inmediatamente y explica cada parte importante.`;

// Generar código con explicación
router.post('/generate', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const {
      description,
      language = 'javascript',
      framework,
      complexity = 'intermediate',
      includeTests = false,
      includeComments = true
    } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'La descripción del código es requerida' });
    }

    console.log(`💻 [${taskId}] Generando código: "${description}" en ${language}`);

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 20,
      message: 'Analizando requerimientos...'
    });

    // Construir prompt específico
    let prompt = `${TECH_CODING_PERSONALITY}

SOLICITUD: ${description}
LENGUAJE: ${language}
${framework ? `FRAMEWORK: ${framework}` : ''}
COMPLEJIDAD: ${complexity}
INCLUIR TESTS: ${includeTests ? 'Sí' : 'No'}
INCLUIR COMENTARIOS: ${includeComments ? 'Sí' : 'No'}

Por favor, genera el código solicitado siguiendo las mejores prácticas.`;

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 50,
      message: 'Generando código con IA...'
    });

    const response = await axios.post(
      `${process.env.OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 2000,
        temperature: 0.3 // Menos creatividad para código más preciso
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedCode = response.data.choices[0].message.content;

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 80,
      message: 'Guardando código generado...'
    });

    // Guardar código en archivo
    const fileExtensions = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      bash: 'sh',
      sql: 'sql',
      json: 'json',
      yaml: 'yml'
    };

    const extension = fileExtensions[language.toLowerCase()] || 'txt';
    const filename = `code_${taskId}.${extension}`;
    const filepath = path.join('uploads/code', filename);

    // Extraer solo el código del response (sin explicaciones)
    const codeBlocks = generatedCode.match(/```[\s\S]*?```/g);
    const codeContent = codeBlocks ? 
      codeBlocks.map(block => block.replace(/```\w*\n?/, '').replace(/```$/, '')).join('\n\n') :
      generatedCode;

    await fs.writeFile(filepath, codeContent);

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Código generado exitosamente'
    });

    console.log(`✅ [${taskId}] Código guardado: ${filename}`);

    res.json({
      success: true,
      taskId,
      code: {
        id: taskId,
        filename: filename,
        url: `/uploads/code/${filename}`,
        description: description,
        language: language,
        framework: framework,
        complexity: complexity,
        content: generatedCode,
        codeOnly: codeContent,
        includeTests: includeTests,
        includeComments: includeComments,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error generando código:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al generar el código'
    });

    res.status(500).json({ 
      error: 'Error al generar el código',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Revisar y mejorar código existente
router.post('/review', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const {
      code,
      language,
      reviewType = 'general', // general, security, performance, style
      suggestions = true
    } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'El código a revisar es requerido' });
    }

    console.log(`🔍 [${taskId}] Revisando código en ${language}`);

    const reviewPrompts = {
      general: 'Revisa este código en general, identifica errores, mejoras y buenas prácticas',
      security: 'Enfócate en vulnerabilidades de seguridad y mejores prácticas de seguridad',
      performance: 'Analiza el rendimiento del código y sugiere optimizaciones',
      style: 'Revisa el estilo del código, consistencia y legibilidad'
    };

    const prompt = `${TECH_CODING_PERSONALITY}

TIPO DE REVISIÓN: ${reviewPrompts[reviewType]}
LENGUAJE: ${language || 'detectar automáticamente'}
INCLUIR SUGERENCIAS: ${suggestions ? 'Sí' : 'No'}

CÓDIGO A REVISAR:
\`\`\`
${code}
\`\`\`

Proporciona una revisión detallada con:
1. Problemas encontrados
2. Código mejorado (si es necesario)
3. Explicación de los cambios
4. Recomendaciones adicionales`;

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 50,
      message: 'Analizando código...'
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
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const review = response.data.choices[0].message.content;

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Revisión completada'
    });

    res.json({
      success: true,
      taskId,
      review: {
        id: taskId,
        originalCode: code,
        language: language,
        reviewType: reviewType,
        content: review,
        suggestions: suggestions,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error revisando código:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al revisar el código'
    });

    res.status(500).json({ 
      error: 'Error al revisar el código',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Explicar código existente
router.post('/explain', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const {
      code,
      language,
      level = 'intermediate' // beginner, intermediate, advanced
    } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'El código a explicar es requerido' });
    }

    console.log(`📖 [${taskId}] Explicando código en ${language}`);

    const levelDescriptions = {
      beginner: 'Explica de forma simple, asumiendo conocimientos básicos',
      intermediate: 'Explica con detalle técnico moderado',
      advanced: 'Explica con profundidad técnica y conceptos avanzados'
    };

    const prompt = `${TECH_CODING_PERSONALITY}

NIVEL DE EXPLICACIÓN: ${levelDescriptions[level]}
LENGUAJE: ${language || 'detectar automáticamente'}

CÓDIGO A EXPLICAR:
\`\`\`
${code}
\`\`\`

Proporciona una explicación completa que incluya:
1. Propósito general del código
2. Explicación línea por línea de las partes importantes
3. Conceptos clave utilizados
4. Posibles casos de uso
5. Cómo ejecutar o usar el código`;

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 50,
      message: 'Analizando y explicando código...'
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

    const explanation = response.data.choices[0].message.content;

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Explicación completada'
    });

    res.json({
      success: true,
      taskId,
      explanation: {
        id: taskId,
        originalCode: code,
        language: language,
        level: level,
        content: explanation,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error explicando código:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al explicar el código'
    });

    res.status(500).json({ 
      error: 'Error al explicar el código',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Generar tests para código
router.post('/generate-tests', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const {
      code,
      language,
      testFramework, // jest, mocha, pytest, etc.
      testType = 'unit' // unit, integration, e2e
    } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'El código para generar tests es requerido' });
    }

    console.log(`🧪 [${taskId}] Generando tests para código en ${language}`);

    const prompt = `${TECH_CODING_PERSONALITY}

GENERAR TESTS PARA EL SIGUIENTE CÓDIGO:
LENGUAJE: ${language}
FRAMEWORK DE TESTING: ${testFramework || 'framework estándar del lenguaje'}
TIPO DE TESTS: ${testType}

CÓDIGO ORIGINAL:
\`\`\`
${code}
\`\`\`

Genera tests completos que incluyan:
1. Tests para casos normales
2. Tests para casos edge
3. Tests para manejo de errores
4. Configuración necesaria
5. Instrucciones para ejecutar los tests`;

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 50,
      message: 'Generando tests...'
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
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const tests = response.data.choices[0].message.content;

    // Guardar tests en archivo
    const testExtensions = {
      javascript: 'test.js',
      typescript: 'test.ts',
      python: 'test.py'
    };

    const extension = testExtensions[language.toLowerCase()] || 'test.txt';
    const filename = `tests_${taskId}.${extension}`;
    const filepath = path.join('uploads/code', filename);

    // Extraer código de tests
    const testBlocks = tests.match(/```[\s\S]*?```/g);
    const testContent = testBlocks ? 
      testBlocks.map(block => block.replace(/```\w*\n?/, '').replace(/```$/, '')).join('\n\n') :
      tests;

    await fs.writeFile(filepath, testContent);

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Tests generados exitosamente'
    });

    res.json({
      success: true,
      taskId,
      tests: {
        id: taskId,
        filename: filename,
        url: `/uploads/code/${filename}`,
        originalCode: code,
        language: language,
        testFramework: testFramework,
        testType: testType,
        content: tests,
        testCode: testContent,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error generando tests:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al generar los tests'
    });

    res.status(500).json({ 
      error: 'Error al generar los tests',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Obtener código generado
router.get('/:codeId', async (req, res) => {
  try {
    const { codeId } = req.params;
    const codeDir = path.join('uploads/code');
    const files = await fs.readdir(codeDir);
    const codeFile = files.find(file => file.startsWith(`code_${codeId}.`) || file.startsWith(`tests_${codeId}.`));
    
    if (!codeFile) {
      return res.status(404).json({ error: 'Código no encontrado' });
    }

    const filepath = path.join(codeDir, codeFile);
    const content = await fs.readFile(filepath, 'utf8');
    const stats = await fs.stat(filepath);

    res.json({
      success: true,
      code: {
        id: codeId,
        filename: codeFile,
        url: `/uploads/code/${codeFile}`,
        content: content,
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });

  } catch (error) {
    console.error('Error obteniendo código:', error);
    res.status(500).json({ 
      error: 'Error al obtener el código',
      details: error.message
    });
  }
});

// Listar código generado
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, language, type } = req.query;
    
    const codeDir = path.join('uploads/code');
    const files = await fs.readdir(codeDir);
    
    let codeFiles = files.filter(file => 
      file.startsWith('code_') || file.startsWith('tests_')
    );

    // Filtrar por lenguaje si se especifica
    if (language) {
      const extensions = {
        javascript: ['.js'],
        typescript: ['.ts'],
        python: ['.py'],
        html: ['.html'],
        css: ['.css'],
        bash: ['.sh'],
        sql: ['.sql']
      };
      
      const validExtensions = extensions[language.toLowerCase()] || [];
      codeFiles = codeFiles.filter(file => 
        validExtensions.some(ext => file.endsWith(ext))
      );
    }

    // Filtrar por tipo si se especifica
    if (type) {
      codeFiles = codeFiles.filter(file => 
        type === 'tests' ? file.startsWith('tests_') : file.startsWith('code_')
      );
    }
    
    const codeList = [];
    
    for (const file of codeFiles) {
      const filepath = path.join(codeDir, file);
      const stats = await fs.stat(filepath);
      const extension = path.extname(file);
      
      codeList.push({
        id: file.replace(/^(code_|tests_)/, '').replace(/\.[^.]+$/, ''),
        filename: file,
        url: `/uploads/code/${file}`,
        type: file.startsWith('tests_') ? 'tests' : 'code',
        language: this.getLanguageFromExtension(extension),
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      });
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    codeList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginar
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCode = codeList.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      code: paginatedCode,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: codeList.length,
        pages: Math.ceil(codeList.length / limit)
      }
    });

  } catch (error) {
    console.error('Error listando código:', error);
    res.status(500).json({ 
      error: 'Error al listar el código',
      details: error.message
    });
  }
});

// Helper function para obtener lenguaje por extensión
function getLanguageFromExtension(extension) {
  const languageMap = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.html': 'html',
    '.css': 'css',
    '.sh': 'bash',
    '.sql': 'sql',
    '.json': 'json',
    '.yml': 'yaml',
    '.yaml': 'yaml'
  };
  
  return languageMap[extension.toLowerCase()] || 'text';
}

// Eliminar código
router.delete('/:codeId', async (req, res) => {
  try {
    const { codeId } = req.params;
    const codeDir = path.join('uploads/code');
    const files = await fs.readdir(codeDir);
    const codeFiles = files.filter(file => 
      file.startsWith(`code_${codeId}.`) || file.startsWith(`tests_${codeId}.`)
    );
    
    if (codeFiles.length === 0) {
      return res.status(404).json({ error: 'Código no encontrado' });
    }

    for (const file of codeFiles) {
      await fs.remove(path.join(codeDir, file));
    }
    
    console.log(`🗑️ Código eliminado: ${codeId}`);

    res.json({
      success: true,
      message: 'Código eliminado exitosamente',
      codeId,
      filesDeleted: codeFiles.length
    });

  } catch (error) {
    console.error('Error eliminando código:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el código',
      details: error.message
    });
  }
});

module.exports = router;