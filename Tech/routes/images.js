const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const router = express.Router();

// Middleware para obtener io
const getIO = (req) => req.app.get('io');

// Generar imagen con DALL-E
router.post('/generate', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const { 
      prompt, 
      size = '1024x1024', 
      quality = 'standard', 
      style = 'vivid',
      n = 1
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido' });
    }

    console.log(`🎨 [${taskId}] Generando imagen: "${prompt}"`);
    
    // Emitir progreso inicial
    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 10,
      message: 'Enviando solicitud a DALL-E...'
    });

    const response = await axios.post(
      `${process.env.OPENAI_API_URL}/images/generations`,
      {
        model: 'dall-e-2',
        prompt: prompt,
        n: n,
        size: size,
        response_format: 'url'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 60,
      message: 'Descargando imagen generada...'
    });

    const imageUrl = response.data.data[0].url;
    const revisedPrompt = response.data.data[0].revised_prompt;
    
    // Descargar y guardar la imagen
    const imageResponse = await axios.get(imageUrl, { 
      responseType: 'stream',
      timeout: 30000
    });
    
    const filename = `dalle_${taskId}.png`;
    const filepath = path.join('uploads/images', filename);
    
    const writer = fs.createWriteStream(filepath);
    imageResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 90,
      message: 'Procesando imagen...'
    });

    // Obtener metadatos de la imagen
    const metadata = await sharp(filepath).metadata();

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Imagen generada exitosamente'
    });

    console.log(`✅ [${taskId}] Imagen guardada: ${filename}`);

    res.json({
      success: true,
      taskId,
      image: {
        id: taskId,
        filename: filename,
        url: `/uploads/images/${filename}`,
        originalPrompt: prompt,
        revisedPrompt: revisedPrompt,
        size: size,
        quality: quality,
        style: style,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        },
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error generando imagen:`, error.response?.data || error.message);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al generar la imagen'
    });

    res.status(500).json({ 
      error: 'Error al generar la imagen',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Generar múltiples imágenes
router.post('/generate-batch', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const { 
      prompts, 
      size = '1024x1024', 
      quality = 'standard', 
      style = 'vivid' 
    } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de prompts' });
    }

    console.log(`🎨 [${taskId}] Generando ${prompts.length} imágenes...`);

    const images = [];
    const total = prompts.length;
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const currentProgress = Math.round((i / total) * 80);
      
      io.to(taskId).emit('task-progress', {
        taskId,
        progress: currentProgress,
        message: `Generando imagen ${i + 1} de ${total}...`
      });
      
      try {
        const response = await axios.post(
          `${process.env.OPENAI_API_URL}/images/generations`,
          {
            model: 'dall-e-2',
            prompt: prompt,
            n: 1,
            size: size,
            response_format: 'url'
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        const imageUrl = response.data.data[0].url;
        const revisedPrompt = response.data.data[0].revised_prompt;
        
        // Descargar y guardar la imagen
        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'stream',
          timeout: 30000
        });
        
        const filename = `dalle_batch_${taskId}_${i}.png`;
        const filepath = path.join('uploads/images', filename);
        
        const writer = fs.createWriteStream(filepath);
        imageResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Obtener metadatos
        const metadata = await sharp(filepath).metadata();

        images.push({
          id: `${taskId}_${i}`,
          filename: filename,
          url: `/uploads/images/${filename}`,
          originalPrompt: prompt,
          revisedPrompt: revisedPrompt,
          size: size,
          quality: quality,
          style: style,
          order: i,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size
          },
          createdAt: new Date().toISOString()
        });

        console.log(`✅ [${taskId}] Imagen ${i + 1}/${total} generada: ${filename}`);

        // Pausa para evitar rate limiting
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ [${taskId}] Error generando imagen ${i + 1}:`, error.response?.data || error.message);
        
        images.push({
          error: true,
          originalPrompt: prompt,
          message: error.response?.data?.error?.message || error.message,
          order: i
        });
      }
    }

    io.to(taskId).emit('task-complete', {
      taskId,
      message: `Generación completada: ${images.filter(img => !img.error).length}/${total} imágenes exitosas`
    });

    res.json({
      success: true,
      taskId,
      images: images,
      total: total,
      successful: images.filter(img => !img.error).length,
      failed: images.filter(img => img.error).length
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error en generación batch:`, error);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error en la generación por lotes'
    });

    res.status(500).json({ 
      error: 'Error al generar las imágenes',
      details: error.message,
      taskId
    });
  }
});

// Editar imagen existente
router.post('/edit', async (req, res) => {
  const taskId = uuidv4();
  const io = getIO(req);
  
  try {
    const { 
      imageId, 
      prompt, 
      mask,
      size = '1024x1024',
      n = 1
    } = req.body;

    if (!imageId || !prompt) {
      return res.status(400).json({ error: 'imageId y prompt son requeridos' });
    }

    console.log(`🎨 [${taskId}] Editando imagen: ${imageId}`);

    const imagePath = path.join('uploads/images', `${imageId}.png`);
    
    if (!await fs.pathExists(imagePath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 20,
      message: 'Preparando imagen para edición...'
    });

    // Preparar FormData para la edición
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('image', fs.createReadStream(imagePath));
    form.append('prompt', prompt);
    form.append('n', n.toString());
    form.append('size', size);
    
    if (mask) {
      // Si hay máscara, agregarla
      const maskPath = path.join('temp', `mask_${taskId}.png`);
      await fs.writeFile(maskPath, Buffer.from(mask, 'base64'));
      form.append('mask', fs.createReadStream(maskPath));
    }

    io.to(taskId).emit('task-progress', {
      taskId,
      progress: 50,
      message: 'Enviando a DALL-E para edición...'
    });

    const response = await axios.post(
      `${process.env.OPENAI_API_URL}/images/edits`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders()
        },
        timeout: 60000
      }
    );

    const editedImageUrl = response.data.data[0].url;
    
    // Descargar imagen editada
    const imageResponse = await axios.get(editedImageUrl, { 
      responseType: 'stream',
      timeout: 30000
    });
    
    const filename = `dalle_edited_${taskId}.png`;
    const filepath = path.join('uploads/images', filename);
    
    const writer = fs.createWriteStream(filepath);
    imageResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Limpiar archivos temporales
    if (mask) {
      const maskPath = path.join('temp', `mask_${taskId}.png`);
      await fs.remove(maskPath);
    }

    const metadata = await sharp(filepath).metadata();

    io.to(taskId).emit('task-complete', {
      taskId,
      message: 'Imagen editada exitosamente'
    });

    res.json({
      success: true,
      taskId,
      image: {
        id: taskId,
        filename: filename,
        url: `/uploads/images/${filename}`,
        originalImageId: imageId,
        editPrompt: prompt,
        size: size,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        },
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${taskId}] Error editando imagen:`, error.response?.data || error.message);
    
    io.to(taskId).emit('task-error', {
      taskId,
      message: 'Error al editar la imagen'
    });

    res.status(500).json({ 
      error: 'Error al editar la imagen',
      details: error.response?.data?.error?.message || error.message,
      taskId
    });
  }
});

// Obtener información de una imagen
router.get('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const imagePath = path.join('uploads/images', `${imageId}.png`);
    
    if (!await fs.pathExists(imagePath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);

    res.json({
      success: true,
      image: {
        id: imageId,
        filename: `${imageId}.png`,
        url: `/uploads/images/${imageId}.png`,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size,
          channels: metadata.channels,
          density: metadata.density
        },
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });

  } catch (error) {
    console.error('Error obteniendo información de imagen:', error);
    res.status(500).json({ 
      error: 'Error al obtener información de la imagen',
      details: error.message
    });
  }
});

// Listar imágenes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const imagesDir = path.join('uploads/images');
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
    
    const images = [];
    
    for (const file of imageFiles) {
      const filepath = path.join(imagesDir, file);
      const stats = await fs.stat(filepath);
      const metadata = await sharp(filepath).metadata();
      
      images.push({
        id: path.parse(file).name,
        filename: file,
        url: `/uploads/images/${file}`,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        },
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      });
    }
    
    // Ordenar
    images.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (order === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
    
    // Paginar
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedImages = images.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      images: paginatedImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: images.length,
        pages: Math.ceil(images.length / limit)
      }
    });

  } catch (error) {
    console.error('Error listando imágenes:', error);
    res.status(500).json({ 
      error: 'Error al listar las imágenes',
      details: error.message
    });
  }
});

// Eliminar imagen
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const imagePath = path.join('uploads/images', `${imageId}.png`);
    
    if (!await fs.pathExists(imagePath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    await fs.remove(imagePath);
    
    console.log(`🗑️ Imagen eliminada: ${imageId}`);

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      imageId
    });

  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la imagen',
      details: error.message
    });
  }
});

module.exports = router;