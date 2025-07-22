// Tech AI Agent - Función de Generación de Imágenes
class ImagesFunction {
  constructor(app) {
    this.app = app;
    this.generatedImages = [];
    this.currentBatch = null;
  }

  async render(container) {
    container.innerHTML = `
      <div class="images-function">
        <div class="function-header">
          <h2>🎨 Generación de Imágenes con DALL-E 2</h2>
          <p>Crea imágenes increíbles a partir de descripciones de texto usando inteligencia artificial</p>
        </div>

        <div class="images-content">
          <div class="images-generator">
            <div class="generator-form">
              <div class="form-group">
                <label for="imagePrompt" class="form-label">Describe la imagen que quieres crear</label>
                <textarea 
                  id="imagePrompt" 
                  class="form-textarea" 
                  rows="3" 
                  placeholder="Ejemplo: Un gato astronauta flotando en el espacio con la Tierra de fondo, estilo realista"
                ></textarea>
                <div class="form-help">Sé específico y descriptivo para obtener mejores resultados</div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="imageSize" class="form-label">Tamaño</label>
                  <select id="imageSize" class="form-select">
                    <option value="1024x1024">Cuadrado (1024x1024)</option>
                    <option value="512x512">Pequeño (512x512)</option>
                    <option value="256x256">Mini (256x256)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="imageStyle" class="form-label">Estilo</label>
                  <select id="imageStyle" class="form-select">
                    <option value="vivid">Vívido</option>
                    <option value="natural">Natural</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="imageQuality" class="form-label">Calidad</label>
                  <select id="imageQuality" class="form-select">
                    <option value="standard">Estándar</option>
                    <option value="hd">HD</option>
                  </select>
                </div>
              </div>

              <div class="form-actions">
                <button id="generateSingleImage" class="btn btn-primary">
                  <i class="fas fa-magic"></i>
                  Generar Imagen
                </button>
                <button id="showBatchModal" class="btn btn-secondary">
                  <i class="fas fa-layer-group"></i>
                  Generar Múltiples
                </button>
              </div>
            </div>

            <div class="quick-prompts">
              <h3>Prompts Sugeridos</h3>
              <div class="prompt-suggestions">
                <button class="prompt-btn" data-prompt="Un paisaje futurista con ciudades flotantes y auroras boreales">
                  🏙️ Ciudad Futurista
                </button>
                <button class="prompt-btn" data-prompt="Un dragón majestuoso volando sobre montañas nevadas al atardecer">
                  🐉 Dragón Épico
                </button>
                <button class="prompt-btn" data-prompt="Una biblioteca mágica con libros flotantes y luces doradas">
                  📚 Biblioteca Mágica
                </button>
                <button class="prompt-btn" data-prompt="Un robot amigable en un jardín lleno de flores coloridas">
                  🤖 Robot en Jardín
                </button>
                <button class="prompt-btn" data-prompt="Una nave espacial explorando un planeta alienígena con dos soles">
                  🚀 Exploración Espacial
                </button>
                <button class="prompt-btn" data-prompt="Un castillo medieval en una isla flotante rodeada de nubes">
                  🏰 Castillo Flotante
                </button>
              </div>
            </div>
          </div>

          <div class="images-gallery">
            <div class="gallery-header">
              <h3>Imágenes Generadas</h3>
              <div class="gallery-controls">
                <button id="clearGallery" class="btn btn-ghost btn-sm">
                  <i class="fas fa-trash"></i>
                  Limpiar
                </button>
                <button id="downloadAll" class="btn btn-ghost btn-sm" style="display: none;">
                  <i class="fas fa-download"></i>
                  Descargar Todo
                </button>
              </div>
            </div>
            <div id="imagesGrid" class="images-grid">
              <div class="empty-state">
                <div class="empty-icon">🎨</div>
                <h4>No hay imágenes generadas</h4>
                <p>Escribe un prompt y genera tu primera imagen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.loadSavedImages();
  }

  setupEventListeners() {
    // Generar imagen individual
    document.getElementById('generateSingleImage').addEventListener('click', () => {
      this.generateSingleImage();
    });

    // Mostrar modal de generación múltiple
    document.getElementById('showBatchModal').addEventListener('click', () => {
      this.showBatchModal();
    });

    // Prompts sugeridos
    document.querySelectorAll('.prompt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.target.dataset.prompt;
        document.getElementById('imagePrompt').value = prompt;
      });
    });

    // Limpiar galería
    document.getElementById('clearGallery').addEventListener('click', () => {
      this.clearGallery();
    });

    // Descargar todas las imágenes
    document.getElementById('downloadAll').addEventListener('click', () => {
      this.downloadAllImages();
    });

    // Enter en textarea para generar
    document.getElementById('imagePrompt').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.generateSingleImage();
      }
    });
  }

  async generateSingleImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    
    if (!prompt) {
      this.app.showToast('Por favor, describe la imagen que quieres crear', 'warning');
      return;
    }

    const taskId = this.app.generateId();
    
    try {
      this.app.showLoading('Generando imagen...', 0);
      
      // Unirse a la tarea para recibir actualizaciones
      this.app.socket.emit('join-task', taskId);

      const response = await this.app.apiRequest('/api/images/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt,
          size: document.getElementById('imageSize').value,
          style: document.getElementById('imageStyle').value,
          quality: document.getElementById('imageQuality').value
        })
      });

      if (response.success) {
        this.addImageToGallery(response.image);
        this.app.showToast('Imagen generada exitosamente', 'success');
        
        // Limpiar prompt
        document.getElementById('imagePrompt').value = '';
      } else {
        throw new Error(response.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error generando imagen:', error);
      this.app.showToast('Error al generar la imagen: ' + error.message, 'error');
    } finally {
      this.app.hideLoading();
    }
  }

  showBatchModal() {
    const modalContent = `
      <div class="modal-header">
        <h2 class="modal-title">Generar Múltiples Imágenes</h2>
        <button class="modal-close" onclick="app.hideModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="batchPrompts" class="form-label">Prompts (uno por línea)</label>
          <textarea 
            id="batchPrompts" 
            class="form-textarea" 
            rows="8" 
            placeholder="Un gato en el espacio&#10;Un perro pirata&#10;Una ciudad submarina&#10;Un robot jardinero"
          ></textarea>
          <div class="form-help">Cada línea será una imagen diferente. Máximo 10 imágenes por lote.</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="batchSize" class="form-label">Tamaño</label>
            <select id="batchSize" class="form-select">
              <option value="1024x1024">Cuadrado (1024x1024)</option>
              <option value="512x512">Pequeño (512x512)</option>
              <option value="256x256">Mini (256x256)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="batchStyle" class="form-label">Estilo</label>
            <select id="batchStyle" class="form-select">
              <option value="vivid">Vívido</option>
              <option value="natural">Natural</option>
            </select>
          </div>

          <div class="form-group">
            <label for="batchQuality" class="form-label">Calidad</label>
            <select id="batchQuality" class="form-select">
              <option value="standard">Estándar</option>
              <option value="hd">HD</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="app.hideModal()">Cancelar</button>
        <button id="generateBatch" class="btn btn-primary">
          <i class="fas fa-magic"></i>
          Generar Lote
        </button>
      </div>
    `;

    this.app.showModal(modalContent);

    // Event listener para generar lote
    document.getElementById('generateBatch').addEventListener('click', () => {
      this.generateBatchImages();
    });
  }

  async generateBatchImages() {
    const promptsText = document.getElementById('batchPrompts').value.trim();
    
    if (!promptsText) {
      this.app.showToast('Por favor, ingresa al menos un prompt', 'warning');
      return;
    }

    const prompts = promptsText.split('\n').filter(p => p.trim()).slice(0, 10);
    
    if (prompts.length === 0) {
      this.app.showToast('No se encontraron prompts válidos', 'warning');
      return;
    }

    const taskId = this.app.generateId();
    
    try {
      this.app.hideModal();
      this.app.showLoading(`Generando ${prompts.length} imágenes...`, 0);
      
      // Unirse a la tarea para recibir actualizaciones
      this.app.socket.emit('join-task', taskId);

      const response = await this.app.apiRequest('/api/images/generate-batch', {
        method: 'POST',
        body: JSON.stringify({
          prompts: prompts,
          size: document.getElementById('batchSize').value,
          style: document.getElementById('batchStyle').value,
          quality: document.getElementById('batchQuality').value
        })
      });

      if (response.success) {
        // Agregar imágenes exitosas a la galería
        response.images.forEach(image => {
          if (!image.error) {
            this.addImageToGallery(image);
          }
        });

        const successCount = response.successful;
        const failCount = response.failed;
        
        if (failCount > 0) {
          this.app.showToast(`${successCount} imágenes generadas, ${failCount} fallaron`, 'warning');
        } else {
          this.app.showToast(`${successCount} imágenes generadas exitosamente`, 'success');
        }
      } else {
        throw new Error(response.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error generando lote:', error);
      this.app.showToast('Error al generar las imágenes: ' + error.message, 'error');
    } finally {
      this.app.hideLoading();
    }
  }

  addImageToGallery(image) {
    // Remover empty state si existe
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const grid = document.getElementById('imagesGrid');
    
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card';
    imageCard.innerHTML = `
      <div class="image-container">
        <img src="${image.url}" alt="Imagen generada" loading="lazy">
        <div class="image-overlay">
          <button class="image-action" onclick="imagesFunction.viewImage('${image.id}')" title="Ver imagen">
            <i class="fas fa-eye"></i>
          </button>
          <button class="image-action" onclick="imagesFunction.downloadImage('${image.url}', '${image.filename}')" title="Descargar">
            <i class="fas fa-download"></i>
          </button>
          <button class="image-action" onclick="imagesFunction.copyImageUrl('${image.url}')" title="Copiar URL">
            <i class="fas fa-link"></i>
          </button>
          <button class="image-action danger" onclick="imagesFunction.deleteImage('${image.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="image-info">
        <div class="image-prompt">${image.originalPrompt}</div>
        <div class="image-meta">
          <span class="image-size">${image.size}</span>
          <span class="image-quality">${image.quality}</span>
          <span class="image-style">${image.style}</span>
        </div>
        <div class="image-date">${this.app.formatTime(new Date(image.createdAt))}</div>
      </div>
    `;

    grid.appendChild(imageCard);
    this.generatedImages.push(image);

    // Mostrar botón de descargar todo si hay imágenes
    if (this.generatedImages.length > 0) {
      document.getElementById('downloadAll').style.display = 'inline-flex';
    }

    // Animar entrada
    imageCard.style.opacity = '0';
    imageCard.style.transform = 'scale(0.8)';
    
    requestAnimationFrame(() => {
      imageCard.style.transition = 'all 0.3s ease';
      imageCard.style.opacity = '1';
      imageCard.style.transform = 'scale(1)';
    });
  }

  viewImage(imageId) {
    const image = this.generatedImages.find(img => img.id === imageId);
    if (!image) return;

    const modalContent = `
      <div class="modal-header">
        <h2 class="modal-title">Vista de Imagen</h2>
        <button class="modal-close" onclick="app.hideModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="image-viewer">
          <img src="${image.url}" alt="Imagen generada" style="max-width: 100%; height: auto;">
        </div>
        <div class="image-details">
          <h3>Detalles de la Imagen</h3>
          <div class="detail-row">
            <strong>Prompt Original:</strong>
            <p>${image.originalPrompt}</p>
          </div>
          ${image.revisedPrompt ? `
            <div class="detail-row">
              <strong>Prompt Revisado:</strong>
              <p>${image.revisedPrompt}</p>
            </div>
          ` : ''}
          <div class="detail-row">
            <strong>Configuración:</strong>
            <p>Tamaño: ${image.size} | Calidad: ${image.quality} | Estilo: ${image.style}</p>
          </div>
          <div class="detail-row">
            <strong>Creado:</strong>
            <p>${this.app.formatTime(new Date(image.createdAt))}</p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="imagesFunction.downloadImage('${image.url}', '${image.filename}')">
          <i class="fas fa-download"></i>
          Descargar
        </button>
        <button class="btn btn-primary" onclick="imagesFunction.copyImageUrl('${image.url}')">
          <i class="fas fa-link"></i>
          Copiar URL
        </button>
      </div>
    `;

    this.app.showModal(modalContent);
  }

  async downloadImage(url, filename) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(downloadUrl);
      this.app.showToast('Imagen descargada', 'success');
    } catch (error) {
      console.error('Error descargando imagen:', error);
      this.app.showToast('Error al descargar la imagen', 'error');
    }
  }

  async copyImageUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      this.app.showToast('URL copiada al portapapeles', 'success');
    } catch (error) {
      console.error('Error copiando URL:', error);
      this.app.showToast('Error al copiar la URL', 'error');
    }
  }

  async deleteImage(imageId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      const response = await this.app.apiRequest(`/api/images/${imageId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        // Remover de la galería
        const imageCard = document.querySelector(`[onclick*="${imageId}"]`).closest('.image-card');
        if (imageCard) {
          imageCard.style.transition = 'all 0.3s ease';
          imageCard.style.opacity = '0';
          imageCard.style.transform = 'scale(0.8)';
          
          setTimeout(() => {
            imageCard.remove();
          }, 300);
        }

        // Remover del array
        this.generatedImages = this.generatedImages.filter(img => img.id !== imageId);

        // Mostrar empty state si no hay imágenes
        if (this.generatedImages.length === 0) {
          this.showEmptyState();
        }

        this.app.showToast('Imagen eliminada', 'success');
      } else {
        throw new Error(response.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      this.app.showToast('Error al eliminar la imagen: ' + error.message, 'error');
    }
  }

  clearGallery() {
    if (this.generatedImages.length === 0) return;

    if (!confirm('¿Estás seguro de que quieres limpiar toda la galería?')) {
      return;
    }

    const grid = document.getElementById('imagesGrid');
    grid.innerHTML = '';
    this.generatedImages = [];
    this.showEmptyState();
    
    document.getElementById('downloadAll').style.display = 'none';
    this.app.showToast('Galería limpiada', 'success');
  }

  showEmptyState() {
    const grid = document.getElementById('imagesGrid');
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎨</div>
        <h4>No hay imágenes generadas</h4>
        <p>Escribe un prompt y genera tu primera imagen</p>
      </div>
    `;
  }

  async downloadAllImages() {
    if (this.generatedImages.length === 0) return;

    this.app.showLoading('Preparando descarga...', 0);

    try {
      // Crear un ZIP con todas las imágenes (simulado)
      for (let i = 0; i < this.generatedImages.length; i++) {
        const image = this.generatedImages[i];
        await this.downloadImage(image.url, image.filename);
        
        this.app.updateProgress((i + 1) / this.generatedImages.length * 100);
        
        // Pequeña pausa entre descargas
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.app.showToast(`${this.generatedImages.length} imágenes descargadas`, 'success');
    } catch (error) {
      console.error('Error descargando imágenes:', error);
      this.app.showToast('Error al descargar las imágenes', 'error');
    } finally {
      this.app.hideLoading();
    }
  }

  async loadSavedImages() {
    try {
      const response = await this.app.apiRequest('/api/images?limit=20');
      
      if (response.success && response.images.length > 0) {
        response.images.forEach(image => {
          this.addImageToGallery(image);
        });
      }
    } catch (error) {
      console.error('Error cargando imágenes guardadas:', error);
    }
  }
}

// Crear instancia global
window.ImagesFunction = ImagesFunction;

// Instancia para uso directo
let imagesFunction;