// Tech AI Agent - Aplicación Principal
class TechApp {
  constructor() {
    this.socket = null;
    this.currentFunction = 'welcome';
    this.isLoading = false;
    this.theme = localStorage.getItem('tech-theme') || 'light';
    
    this.init();
  }

  async init() {
    try {
      // Inicializar Socket.IO
      this.initSocket();
      
      // Configurar tema
      this.setTheme(this.theme);
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Inicializar UI
      this.initUI();
      
      console.log('🧠 Tech AI Agent inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando la aplicación:', error);
      this.showToast('Error al inicializar la aplicación', 'error');
    }
  }

  initSocket() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('🔌 Conectado al servidor');
      this.updateConnectionStatus(true);
    });
    
    this.socket.on('disconnect', () => {
      console.log('🔌 Desconectado del servidor');
      this.updateConnectionStatus(false);
    });
    
    this.socket.on('task-progress', (data) => {
      this.updateProgress(data.progress, data.message);
    });
    
    this.socket.on('task-complete', (data) => {
      this.hideLoading();
      this.showToast(data.message || 'Tarea completada', 'success');
    });
    
    this.socket.on('task-error', (data) => {
      this.hideLoading();
      this.showToast(data.message || 'Error en la tarea', 'error');
    });
  }

  setupEventListeners() {
    // Navegación del sidebar
    document.querySelectorAll('.nav-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const functionName = e.currentTarget.closest('.nav-item').dataset.function;
        this.switchFunction(functionName);
      });
    });

    // Botón nueva tarea
    document.getElementById('newTaskBtn').addEventListener('click', () => {
      this.showNewTaskModal();
    });

    // Toggle sidebar en móvil
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Toggle tema
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Toggle pantalla completa
    document.getElementById('fullscreenToggle').addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Cards de capacidades
    document.querySelectorAll('.capability-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const functionName = e.currentTarget.dataset.function;
        this.switchFunction(functionName);
      });
    });

    // Botones de inicio rápido
    document.querySelectorAll('.quick-start-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const functionName = e.currentTarget.dataset.function;
        this.switchFunction(functionName);
      });
    });

    // Cerrar modal al hacer clic fuera
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  initUI() {
    // Actualizar estado inicial de la UI
    this.updateActiveNavItem('welcome');
    this.updateHeaderTitle('Bienvenido a Tech', 'Tu agente de IA todo en uno');
    
    // Mostrar pantalla de bienvenida
    this.showWelcomeScreen();
  }

  // Navegación entre funciones
  async switchFunction(functionName) {
    if (this.isLoading) return;
    
    try {
      // Actualizar UI
      this.updateActiveNavItem(functionName);
      this.hideAllPanels();
      
      // Cargar función específica
      switch (functionName) {
        case 'images':
          await this.loadImagesFunction();
          break;
        case 'videos':
          await this.loadVideosFunction();
          break;
        case 'code':
          await this.loadCodeFunction();
          break;
        case 'automation':
          await this.loadAutomationFunction();
          break;
        case 'chat':
          await this.loadChatFunction();
          break;
        case 'settings':
          await this.loadSettingsFunction();
          break;
        case 'history':
          await this.loadHistoryFunction();
          break;
        default:
          this.showWelcomeScreen();
          return;
      }
      
      this.currentFunction = functionName;
      
    } catch (error) {
      console.error(`Error cargando función ${functionName}:`, error);
      this.showToast(`Error al cargar ${functionName}`, 'error');
    }
  }

  // Cargar funciones específicas
  async loadImagesFunction() {
    this.updateHeaderTitle('📸 Generar Imágenes', 'Crea imágenes increíbles con DALL-E 2');
    
    if (window.ImagesFunction) {
      const panel = document.getElementById('imagesPanel');
      panel.style.display = 'block';
      
      if (!panel.hasChildNodes()) {
        const imagesFunction = new ImagesFunction(this);
        await imagesFunction.render(panel);
      }
    } else {
      this.showToast('Función de imágenes no disponible', 'error');
    }
  }

  async loadVideosFunction() {
    this.updateHeaderTitle('🎥 Crear Videos', 'Genera videos completos con IA');
    
    if (window.VideosFunction) {
      const panel = document.getElementById('videosPanel');
      panel.style.display = 'block';
      
      if (!panel.hasChildNodes()) {
        const videosFunction = new VideosFunction(this);
        await videosFunction.render(panel);
      }
    } else {
      this.showToast('Función de videos no disponible', 'error');
    }
  }

  async loadCodeFunction() {
    this.updateHeaderTitle('💻 Escribir Código', 'Desarrollo código inteligente en múltiples lenguajes');
    
    if (window.CodeFunction) {
      const panel = document.getElementById('codePanel');
      panel.style.display = 'block';
      
      if (!panel.hasChildNodes()) {
        const codeFunction = new CodeFunction(this);
        await codeFunction.render(panel);
      }
    } else {
      this.showToast('Función de código no disponible', 'error');
    }
  }

  async loadAutomationFunction() {
    this.updateHeaderTitle('🔁 Automatización', 'Automatiza tareas complejas con IA');
    
    if (window.AutomationFunction) {
      const panel = document.getElementById('automationPanel');
      panel.style.display = 'block';
      
      if (!panel.hasChildNodes()) {
        const automationFunction = new AutomationFunction(this);
        await automationFunction.render(panel);
      }
    } else {
      this.showToast('Función de automatización no disponible', 'error');
    }
  }

  async loadChatFunction() {
    this.updateHeaderTitle('💬 Chat General', 'Conversa conmigo sobre cualquier tema');
    
    if (window.ChatFunction) {
      const panel = document.getElementById('chatPanel');
      panel.style.display = 'block';
      
      if (!panel.hasChildNodes()) {
        const chatFunction = new ChatFunction(this);
        await chatFunction.render(panel);
      }
    } else {
      this.showToast('Función de chat no disponible', 'error');
    }
  }

  async loadSettingsFunction() {
    this.updateHeaderTitle('⚙️ Configuración', 'Personaliza tu experiencia con Tech');
    
    if (window.SettingsFunction) {
      const panel = document.getElementById('settingsPanel');
      panel.style.display = 'block';
      
      if (!panel.hasChildNodes()) {
        const settingsFunction = new SettingsFunction(this);
        await settingsFunction.render(panel);
      }
    } else {
      this.showToast('Función de configuración no disponible', 'error');
    }
  }

  async loadHistoryFunction() {
    this.updateHeaderTitle('📋 Historial', 'Revisa tus tareas anteriores');
    // TODO: Implementar función de historial
    this.showToast('Función de historial en desarrollo', 'info');
  }

  // UI Helper Methods
  updateActiveNavItem(functionName) {
    document.querySelectorAll('.nav-button').forEach(button => {
      button.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-function="${functionName}"] .nav-button`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  updateHeaderTitle(title, description) {
    document.getElementById('currentFunctionTitle').textContent = title;
    document.getElementById('currentFunctionDesc').textContent = description;
  }

  hideAllPanels() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.querySelectorAll('.function-panel').forEach(panel => {
      panel.style.display = 'none';
    });
  }

  showWelcomeScreen() {
    this.hideAllPanels();
    document.getElementById('welcomeScreen').style.display = 'block';
    this.updateHeaderTitle('Bienvenido a Tech', 'Tu agente de IA todo en uno');
    this.updateActiveNavItem('welcome');
  }

  // Loading y Progress
  showLoading(title = 'Procesando...', message = 'Por favor espera mientras trabajo en tu solicitud') {
    this.isLoading = true;
    const overlay = document.getElementById('loadingOverlay');
    const titleEl = document.getElementById('loadingTitle');
    const messageEl = document.getElementById('loadingMessage');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.classList.add('visible');
    
    this.updateProgress(0);
  }

  hideLoading() {
    this.isLoading = false;
    document.getElementById('loadingOverlay').classList.remove('visible');
  }

  updateProgress(progress, message = null) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const messageEl = document.getElementById('loadingMessage');
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
    
    if (message) {
      messageEl.textContent = message;
    }
  }

  // Toast Notifications
  showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="${icons[type] || icons.info}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Event listener para cerrar
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    container.appendChild(toast);
    
    // Auto-remove después del duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);
  }

  // Modal
  showModal(content) {
    const overlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = content;
    overlay.classList.add('visible');
  }

  hideModal() {
    document.getElementById('modalOverlay').classList.remove('visible');
  }

  showNewTaskModal() {
    const modalContent = `
      <div class="modal-header">
        <h2 class="modal-title">Nueva Tarea</h2>
        <button class="modal-close" onclick="app.hideModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <p>¿Qué te gustaría hacer?</p>
        <div class="capabilities-grid" style="margin-top: 1rem;">
          <div class="capability-card" onclick="app.switchFunction('images'); app.hideModal();">
            <div class="capability-icon">📸</div>
            <h3>Generar Imágenes</h3>
          </div>
          <div class="capability-card" onclick="app.switchFunction('videos'); app.hideModal();">
            <div class="capability-icon">🎥</div>
            <h3>Crear Videos</h3>
          </div>
          <div class="capability-card" onclick="app.switchFunction('code'); app.hideModal();">
            <div class="capability-icon">💻</div>
            <h3>Escribir Código</h3>
          </div>
          <div class="capability-card" onclick="app.switchFunction('automation'); app.hideModal();">
            <div class="capability-icon">🔁</div>
            <h3>Automatización</h3>
          </div>
        </div>
      </div>
    `;
    
    this.showModal(modalContent);
  }

  // Tema
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(this.theme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tech-theme', theme);
    
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }

  // Sidebar
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-visible');
    
    // Crear/mostrar overlay en móvil
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', () => this.toggleSidebar());
      document.body.appendChild(overlay);
    }
    
    overlay.classList.toggle('visible');
  }

  // Pantalla completa
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      document.querySelector('#fullscreenToggle i').className = 'fas fa-compress';
    } else {
      document.exitFullscreen();
      document.querySelector('#fullscreenToggle i').className = 'fas fa-expand';
    }
  }

  // Estado de conexión
  updateConnectionStatus(connected) {
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${connected ? '' : 'offline'}`;
    }
  }

  // Atajos de teclado
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K para nueva tarea
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.showNewTaskModal();
    }
    
    // Escape para cerrar modal
    if (e.key === 'Escape') {
      this.hideModal();
    }
    
    // Ctrl/Cmd + / para toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      this.toggleSidebar();
    }
  }

  // API Helper Methods
  async apiRequest(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Utilidades
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  formatTime(date) {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TechApp();
});

// Manejar errores globales
window.addEventListener('error', (e) => {
  console.error('Error global:', e.error);
  if (window.app) {
    window.app.showToast('Ha ocurrido un error inesperado', 'error');
  }
});

// Manejar promesas rechazadas
window.addEventListener('unhandledrejection', (e) => {
  console.error('Promesa rechazada:', e.reason);
  if (window.app) {
    window.app.showToast('Error en operación asíncrona', 'error');
  }
});