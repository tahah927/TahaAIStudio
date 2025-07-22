// Tech AI Agent - Utilidades de UI
class UIUtils {
  constructor() {
    this.activeToasts = new Set();
    this.activeModals = new Set();
  }

  // Crear elementos DOM de forma programática
  createElement(tag, className = '', attributes = {}, innerHTML = '') {
    const element = document.createElement(tag);
    
    if (className) {
      element.className = className;
    }
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    if (innerHTML) {
      element.innerHTML = innerHTML;
    }
    
    return element;
  }

  // Crear card genérica
  createCard(title, content, actions = []) {
    const card = this.createElement('div', 'card');
    
    const header = this.createElement('div', 'card-header');
    const titleEl = this.createElement('h3', 'card-title', {}, title);
    header.appendChild(titleEl);
    
    const body = this.createElement('div', 'card-body');
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }
    
    card.appendChild(header);
    card.appendChild(body);
    
    if (actions.length > 0) {
      const footer = this.createElement('div', 'card-footer');
      actions.forEach(action => {
        const button = this.createElement('button', `btn ${action.class || 'btn-primary'}`, {}, action.text);
        if (action.onClick) {
          button.addEventListener('click', action.onClick);
        }
        footer.appendChild(button);
      });
      card.appendChild(footer);
    }
    
    return card;
  }

  // Crear formulario dinámico
  createForm(fields, onSubmit) {
    const form = this.createElement('form', 'dynamic-form');
    
    fields.forEach(field => {
      const formGroup = this.createElement('div', 'form-group');
      
      // Label
      if (field.label) {
        const label = this.createElement('label', 'form-label', { for: field.id }, field.label);
        formGroup.appendChild(label);
      }
      
      // Input
      let input;
      switch (field.type) {
        case 'textarea':
          input = this.createElement('textarea', 'form-textarea', {
            id: field.id,
            name: field.name || field.id,
            placeholder: field.placeholder || '',
            rows: field.rows || 4
          });
          break;
        case 'select':
          input = this.createElement('select', 'form-select', {
            id: field.id,
            name: field.name || field.id
          });
          field.options.forEach(option => {
            const optionEl = this.createElement('option', '', { value: option.value }, option.text);
            input.appendChild(optionEl);
          });
          break;
        default:
          input = this.createElement('input', 'form-input', {
            type: field.type || 'text',
            id: field.id,
            name: field.name || field.id,
            placeholder: field.placeholder || '',
            value: field.value || ''
          });
      }
      
      if (field.required) {
        input.setAttribute('required', '');
      }
      
      formGroup.appendChild(input);
      
      // Help text
      if (field.help) {
        const help = this.createElement('div', 'form-help', {}, field.help);
        formGroup.appendChild(help);
      }
      
      form.appendChild(formGroup);
    });
    
    // Submit button
    const submitBtn = this.createElement('button', 'btn btn-primary', { type: 'submit' }, 'Enviar');
    form.appendChild(submitBtn);
    
    // Event listener
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      onSubmit(data);
    });
    
    return form;
  }

  // Crear tabla dinámica
  createTable(headers, rows, options = {}) {
    const table = this.createElement('table', 'data-table');
    
    // Header
    const thead = this.createElement('thead');
    const headerRow = this.createElement('tr');
    
    headers.forEach(header => {
      const th = this.createElement('th', '', {}, header);
      headerRow.appendChild(th);
    });
    
    if (options.actions) {
      const actionTh = this.createElement('th', '', {}, 'Acciones');
      headerRow.appendChild(actionTh);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = this.createElement('tbody');
    
    rows.forEach(row => {
      const tr = this.createElement('tr');
      
      row.forEach(cell => {
        const td = this.createElement('td', '', {}, cell);
        tr.appendChild(td);
      });
      
      if (options.actions) {
        const actionTd = this.createElement('td', 'table-actions');
        options.actions.forEach(action => {
          const btn = this.createElement('button', `btn btn-sm ${action.class}`, {}, action.text);
          if (action.onClick) {
            btn.addEventListener('click', () => action.onClick(row));
          }
          actionTd.appendChild(btn);
        });
        tr.appendChild(actionTd);
      }
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    
    return table;
  }

  // Crear tabs
  createTabs(tabs) {
    const container = this.createElement('div', 'tabs');
    
    // Tab list
    const tabList = this.createElement('ul', 'tabs-list');
    const tabContents = this.createElement('div', 'tab-contents');
    
    tabs.forEach((tab, index) => {
      // Tab button
      const tabItem = this.createElement('li');
      const tabButton = this.createElement('button', `tab-button ${index === 0 ? 'active' : ''}`, {
        'data-tab': tab.id
      }, tab.title);
      
      tabButton.addEventListener('click', () => {
        this.switchTab(tab.id);
      });
      
      tabItem.appendChild(tabButton);
      tabList.appendChild(tabItem);
      
      // Tab content
      const tabContent = this.createElement('div', `tab-content ${index === 0 ? 'active' : ''}`, {
        id: tab.id
      });
      
      if (typeof tab.content === 'string') {
        tabContent.innerHTML = tab.content;
      } else {
        tabContent.appendChild(tab.content);
      }
      
      tabContents.appendChild(tabContent);
    });
    
    container.appendChild(tabList);
    container.appendChild(tabContents);
    
    return container;
  }

  // Cambiar tab activo
  switchTab(tabId) {
    // Desactivar todos los tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Activar tab seleccionado
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);
    
    if (activeButton) activeButton.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
  }

  // Crear progress bar
  createProgressBar(value = 0, max = 100, label = '') {
    const container = this.createElement('div', 'progress-container');
    
    if (label) {
      const labelEl = this.createElement('div', 'progress-label', {}, label);
      container.appendChild(labelEl);
    }
    
    const progressBar = this.createElement('div', 'progress-bar');
    const progressFill = this.createElement('div', 'progress-fill', {
      style: `width: ${(value / max) * 100}%`
    });
    
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);
    
    const progressText = this.createElement('div', 'progress-text', {}, `${Math.round((value / max) * 100)}%`);
    container.appendChild(progressText);
    
    return {
      container,
      update: (newValue) => {
        const percentage = Math.round((newValue / max) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
      }
    };
  }

  // Crear badge
  createBadge(text, type = 'primary') {
    return this.createElement('span', `badge badge-${type}`, {}, text);
  }

  // Crear dropdown
  createDropdown(trigger, items) {
    const dropdown = this.createElement('div', 'dropdown');
    
    const triggerEl = typeof trigger === 'string' 
      ? this.createElement('button', 'dropdown-trigger', {}, trigger)
      : trigger;
    
    const menu = this.createElement('div', 'dropdown-menu');
    
    items.forEach(item => {
      if (item.divider) {
        const divider = this.createElement('div', 'dropdown-divider');
        menu.appendChild(divider);
      } else {
        const menuItem = this.createElement('button', 'dropdown-item', {}, item.text);
        if (item.onClick) {
          menuItem.addEventListener('click', item.onClick);
        }
        menu.appendChild(menuItem);
      }
    });
    
    dropdown.appendChild(triggerEl);
    dropdown.appendChild(menu);
    
    // Toggle functionality
    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    
    // Close on outside click
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
    });
    
    return dropdown;
  }

  // Crear tooltip
  createTooltip(element, text, position = 'top') {
    const tooltip = this.createElement('div', `tooltip tooltip-${position}`, {}, text);
    
    element.addEventListener('mouseenter', () => {
      document.body.appendChild(tooltip);
      
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left, top;
      
      switch (position) {
        case 'top':
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
          top = rect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
          top = rect.bottom + 8;
          break;
        case 'left':
          left = rect.left - tooltipRect.width - 8;
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          left = rect.right + 8;
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          break;
      }
      
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.classList.add('visible');
    });
    
    element.addEventListener('mouseleave', () => {
      tooltip.remove();
    });
  }

  // Formatear fecha
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(new Date(date));
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Copiar al portapapeles
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  }

  // Descargar archivo
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar URL
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Generar ID único
  generateId(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Animar elemento
  animate(element, animation, duration = 300) {
    return new Promise(resolve => {
      element.style.animation = `${animation} ${duration}ms ease-in-out`;
      
      const handleAnimationEnd = () => {
        element.style.animation = '';
        element.removeEventListener('animationend', handleAnimationEnd);
        resolve();
      };
      
      element.addEventListener('animationend', handleAnimationEnd);
    });
  }

  // Scroll suave a elemento
  scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  // Detectar si elemento está visible
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Lazy loading de imágenes
  setupLazyLoading(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
}

// Crear instancia global
window.ui = new UIUtils();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIUtils;
}