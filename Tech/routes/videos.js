const express = require('express');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware para obtener io
const getIO = (req) => req.app.get('io');

// Configurar FFmpeg
try {
  ffmpeg.setFfmpegPath('ffmpeg');
  ffmpeg.setFfprobePath('ffprobe');
} catch (error) {
  console.warn('⚠️ FFmpeg no encontrado en PATH');
}

// Generar guión con GPT-4
async function generateScript(topic, duration, style = 'informativo') {
  const prompt = `Crea un guión para un video de ${duration} segundos sobre: ${topic}

Estilo: ${style}
Formato requerido:
- Divide el contenido en escenas de 3-5 segundos cada una
- Para cada escena incluye:
  * ESCENA X: [Descripción visual detallada para generar imagen]
  * NARRACIÓN: [Texto para convertir a voz]
  * DURACIÓN: [segundos]

El guión debe ser engaging, informativo y apropiado para la duración especificada.
Incluye transiciones naturales entre escenas.`;

  const response = await axios.post(
    `${process.env.OPENAI_API_URL}/chat/completions`,
    {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 1500,
      temperature: 0.7
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

// Generar imagen para escena
async function generateSceneImage(description, size = '1792x1024', style = 'vivid') {
  const response = await axios.post(
    `${process.env.OPENAI_API_URL}/images/generations`,
    {
      model: 'dall-e-2',
      prompt: description,
      n: 1,
      size: size,
      response_format: 'url'
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.data[0].url;
}

// Generar audio con ElevenLabs
async function generateAudio(text, voiceId = 'EXAVITQu4vr4xnSDxMaL') {
  const response = await axios.post(
    `${process.env.ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    }
  );

  return response.data;
}

// Parsear guión generado
function parseScript(scriptText) {
  const scenes = [];
  const lines = scriptText.split('\n');
  let currentScene = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('ESCENA')) {
      if (currentScene) {
        scenes.push(currentScene);
      }
      currentScene = {
        description: trimmedLine.replace(/^ESCENA\s*\d*:\s*/, ''),
        narration: '',
        duration: 3
      };
    } else if (trimmedLine.startsWith('NARRACIÓN:')) {
      if (currentScene) {
        currentScene.narration = trimmedLine.replace(/^NARRACIÓN:\s*/, '');
      }
    } else if (trimmedLine.startsWith('DURACIÓN:')) {
      if (currentScene) {
        const durationMatch = trimmedLine.match(/(\d+)/);
        if (durationMatch) {
          currentScene.duration = parseInt(durationMatch[1]);
        }
      }
    }
  }

  if (currentScene) {
    scenes.push(currentScene);
  }

  return scenes;
}

// Crear video completo automáticamente
router.post('/generate-auto', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const {
      topic,
      duration = 30,
      style = 'informativo',
      aspectRatio = '16:9',
      quality = 'hd',
      voiceId,
      musicTrack,
      subtitles = true
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'El tema del video es requerido' });
    }

    console.log(`🎬 [${taskId}] Generando video automático: "${topic}"`);

    const tempDir = path.join('temp', taskId);
    await fs.ensureDir(tempDir);

    // Paso 1: Generar guión
    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 10,
      message: 'Generando guión con IA...'
    });

    const scriptText = await generateScript(topic, duration, style);
    const scenes = parseScript(scriptText);

    console.log(`📝 [${taskId}] Guión generado con ${scenes.length} escenas`);

    // Paso 2: Generar imágenes para cada escena
    const sceneAssets = [];
    const totalScenes = scenes.length;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const progressBase = 20 + (i / totalScenes) * 30;

      io.to(taskId).emit('task-progress', {
        taskId,
        progress: progressBase,
        message: `Generando imagen ${i + 1} de ${totalScenes}...`
      });

      try {
        // Generar imagen
        const imageUrl = await generateSceneImage(
          scene.description,
          aspectRatio === '16:9' ? '1792x1024' : aspectRatio === '9:16' ? '1024x1792' : '1024x1024'
        );

        // Descargar imagen
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
        const imageFilename = `scene_${i}.png`;
        const imagePath = path.join(tempDir, imageFilename);
        
        const writer = fs.createWriteStream(imagePath);
        imageResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        sceneAssets.push({
          ...scene,
          imagePath,
          sceneIndex: i
        });

        // Pausa para evitar rate limiting
        if (i < scenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Error generando imagen para escena ${i}:`, error);
        // Usar imagen placeholder si falla
        sceneAssets.push({
          ...scene,
          imagePath: null,
          sceneIndex: i,
          error: true
        });
      }
    }

    // Paso 3: Generar audio completo
    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 60,
      message: 'Generando narración con IA...'
    });

    const fullNarration = scenes.map(scene => scene.narration).join(' ');
    
    if (fullNarration.trim()) {
      try {
        const audioStream = await generateAudio(fullNarration, voiceId);
        const audioPath = path.join(tempDir, 'narration.mp3');
        const audioWriter = fs.createWriteStream(audioPath);
        
        audioStream.pipe(audioWriter);
        
        await new Promise((resolve, reject) => {
          audioWriter.on('finish', resolve);
          audioWriter.on('error', reject);
        });

        console.log(`🎵 [${taskId}] Audio generado: ${audioPath}`);
      } catch (error) {
        console.error(`❌ Error generando audio:`, error);
      }
    }

    // Paso 4: Ensamblar video
    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 80,
      message: 'Ensamblando video final...'
    });

    const outputFilename = `video_${taskId}.mp4`;
    const outputPath = path.join('uploads/videos', outputFilename);

    // Configurar resolución
    const resolutions = {
      '16:9': { width: quality === '4k' ? 3840 : quality === 'fullhd' ? 1920 : 1280, height: quality === '4k' ? 2160 : quality === 'fullhd' ? 1080 : 720 },
      '9:16': { width: quality === '4k' ? 2160 : quality === 'fullhd' ? 1080 : 720, height: quality === '4k' ? 3840 : quality === 'fullhd' ? 1920 : 1280 },
      '1:1': { width: quality === '4k' ? 2160 : quality === 'fullhd' ? 1080 : 720, height: quality === '4k' ? 2160 : quality === 'fullhd' ? 1080 : 720 }
    };

    const resolution = resolutions[aspectRatio] || resolutions['16:9'];

    // Crear lista de archivos para FFmpeg
    const fileListPath = path.join(tempDir, 'filelist.txt');
    let fileListContent = '';

    for (const asset of sceneAssets) {
      if (asset.imagePath && !asset.error) {
        fileListContent += `file '${asset.imagePath}'\n`;
        fileListContent += `duration ${asset.duration}\n`;
      }
    }

    // Agregar la última imagen una vez más
    if (sceneAssets.length > 0 && sceneAssets[sceneAssets.length - 1].imagePath) {
      fileListContent += `file '${sceneAssets[sceneAssets.length - 1].imagePath}'\n`;
    }

    await fs.writeFile(fileListPath, fileListContent);

    // Verificar si existe audio antes de crear el video
    const audioPath = path.join(tempDir, 'narration.mp3');
    const audioExists = await fs.pathExists(audioPath);

    // Crear video con FFmpeg
    await new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(fileListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .fps(30)
        .size(`${resolution.width}x${resolution.height}`)
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt', 'yuv420p',
          '-preset', 'medium',
          '-crf', quality === '4k' ? '18' : quality === 'fullhd' ? '20' : '23'
        ]);

      // Agregar audio si existe
      if (audioExists) {
        command = command.input(audioPath);
        command = command.outputOptions([
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-shortest'
        ]);
      }

      command
        .output(outputPath)
        .on('progress', (progress) => {
          const videoProgress = 80 + (progress.percent || 0) * 0.15;
          io.to(taskId).emit('task-progress', {
            taskId,
            progress: Math.min(videoProgress, 95),
            message: `Procesando video: ${Math.round(progress.percent || 0)}%`
          });
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Limpiar archivos temporales
    await fs.remove(tempDir);

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Video generado exitosamente'
    });

    console.log(`✅ [${taskId}] Video generado: ${outputFilename}`);

    res.json({
      success: true,
      taskId,
      video: {
        id: taskId,
        filename: outputFilename,
        url: `/uploads/videos/${outputFilename}`,
        topic,
        duration,
        style,
        aspectRatio,
        quality,
        resolution,
        scenes: scenes.length,
        script: scriptText,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error generando video:`, error);
    
    // Limpiar archivos temporales
    const tempDir = path.join('temp', taskId);
    try {
      await fs.remove(tempDir);
    } catch (cleanupError) {
      console.error('Error limpiando archivos temporales:', cleanupError);
    }

    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al generar el video'
    });

    res.status(500).json({ 
      error: 'Error al generar el video',
      details: error.message,
      taskId
    });
  }
});

// Generar solo guión
router.post('/generate-script', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const { topic, duration = 30, style = 'informativo' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'El tema es requerido' });
    }

    console.log(`📝 [${taskId}] Generando guión: "${topic}"`);

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 50,
      message: 'Generando guión...'
    });

    const scriptText = await generateScript(topic, duration, style);
    const scenes = parseScript(scriptText);

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Guión generado exitosamente'
    });

    res.json({
      success: true,
      taskId,
      script: {
        id: taskId,
        topic,
        duration,
        style,
        content: scriptText,
        scenes: scenes,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error generando guión:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al generar el guión'
    });

    res.status(500).json({ 
      error: 'Error al generar el guión',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Obtener voces disponibles de ElevenLabs
router.get('/voices', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.ELEVENLABS_API_URL}/voices`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
      }
    );

    const voices = response.data.voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      preview_url: voice.preview_url,
      labels: voice.labels
    }));

    res.json({
      success: true,
      voices: voices
    });

  } catch (error) {
    console.error('Error obteniendo voces:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al obtener las voces disponibles',
      details: error.response?.data || error.message
    });
  }
});

// Obtener información de un video
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = path.join('uploads/videos', `${videoId}.mp4`);

    if (!await fs.pathExists(videoPath)) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Error obteniendo info del video:', err);
        return res.status(500).json({ error: 'Error al obtener información del video' });
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

      res.json({
        success: true,
        video: {
          id: videoId,
          filename: `${videoId}.mp4`,
          url: `/uploads/videos/${videoId}.mp4`,
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate),
            aspect_ratio: videoStream.display_aspect_ratio
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sample_rate: audioStream.sample_rate,
            channels: audioStream.channels
          } : null
        }
      });
    });

  } catch (error) {
    console.error('Error obteniendo info del video:', error);
    res.status(500).json({ 
      error: 'Error al obtener información del video',
      details: error.message
    });
  }
});

// Listar videos
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const videosDir = path.join('uploads/videos');
    const files = await fs.readdir(videosDir);
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    
    const videos = [];
    
    for (const file of videoFiles) {
      const filepath = path.join(videosDir, file);
      const stats = await fs.stat(filepath);
      
      videos.push({
        id: path.parse(file).name,
        filename: file,
        url: `/uploads/videos/${file}`,
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      });
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginar
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedVideos = videos.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      videos: paginatedVideos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: videos.length,
        pages: Math.ceil(videos.length / limit)
      }
    });

  } catch (error) {
    console.error('Error listando videos:', error);
    res.status(500).json({ 
      error: 'Error al listar los videos',
      details: error.message
    });
  }
});

// Eliminar video
router.delete('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = path.join('uploads/videos', `${videoId}.mp4`);
    
    if (!await fs.pathExists(videoPath)) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    await fs.remove(videoPath);
    
    console.log(`🗑️ Video eliminado: ${videoId}`);

    res.json({
      success: true,
      message: 'Video eliminado exitosamente',
      videoId
    });

  } catch (error) {
    console.error('Error eliminando video:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el video',
      details: error.message
    });
  }
});

module.exports = router;