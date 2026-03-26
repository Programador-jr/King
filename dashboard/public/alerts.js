class AlertSystem {
  constructor() {
    this.container = null;
    this.alerts = [];
    this.alertId = 0;
    this.currentModal = null;
    this.init();
  }

  init() {
    // Criar container de alertas
    this.container = document.createElement('div');
    this.container.className = 'alerts-container';
    document.body.appendChild(this.container);

    // Carregar CSS se não estiver carregado
    this.loadStyles();
  }

  loadStyles() {
    if (document.querySelector('link[href*="alerts.css"]')) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/dashboard/public/alerts.css';
    document.head.appendChild(link);
  }

  show(type, title, message, options = {}) {
    const defaults = {
      duration: 5000, // 5 segundos
      dismissible: true,
      progressBar: true,
      animation: 'slide'
    };

    const settings = { ...defaults, ...options };
    const id = ++this.alertId;

    // Criar elemento do alerta
    const alert = this.createAlert(type, title, message, settings, id);
    
    // Adicionar ao container
    this.container.appendChild(alert);
    
    // Adicionar à lista de alertas ativos
    this.alerts.push({ id, element: alert, timer: null });

    // Mostrar com animação
    setTimeout(() => {
      alert.classList.add('show');
      if (settings.animation === 'bounce') {
        alert.classList.add('bounce');
      }
    }, 10);

    // Auto-dismiss
    if (settings.duration > 0) {
      this.startProgress(alert, settings.duration);
      const timer = setTimeout(() => {
        this.hide(id);
      }, settings.duration);
      
      // Guardar referência do timer
      const alertData = this.alerts.find(a => a.id === id);
      if (alertData) {
        alertData.timer = timer;
      }
    }

    return id;
  }

  createAlert(type, title, message, settings, id) {
    const alert = document.createElement('div');
    alert.className = `alert-global ${type}`;
    alert.setAttribute('data-alert-id', id);

    // Ícones para cada tipo
    const icons = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'i'
    };

    // Estrutura HTML
    alert.innerHTML = `
      <div class="alert-icon">${icons[type] || 'i'}</div>
      <div class="alert-content">
        <div class="alert-title">${this.escapeHtml(title)}</div>
        ${message ? `<div class="alert-message">${this.escapeHtml(message)}</div>` : ''}
      </div>
      ${settings.dismissible ? `
        <button class="alert-close" onclick="alertSystem.hide(${id})" aria-label="Fechar">
          <i class="fas fa-times"></i>
        </button>
      ` : ''}
      ${settings.progressBar && settings.duration > 0 ? `
        <div class="alert-progress" style="width: 0%"></div>
      ` : ''}
    `;

    return alert;
  }

  startProgress(alert, duration) {
    const progressBar = alert.querySelector('.alert-progress');
    if (!progressBar) return;

    // Iniciar animação da barra de progresso
    progressBar.style.transition = `width ${duration}ms linear`;
    setTimeout(() => {
      progressBar.style.width = '100%';
    }, 10);
  }

  hide(id) {
    const alertData = this.alerts.find(a => a.id === id);
    if (!alertData) return;

    const { element, timer } = alertData;

    // Limpar timer se existir
    if (timer) {
      clearTimeout(timer);
    }

    // Adicionar classe de animação de saída
    element.classList.add('hide');

    // Remover após animação
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Remover da lista
      this.alerts = this.alerts.filter(a => a.id !== id);
    }, 300);
  }

  // Métodos de conveniência
  success(title, message, options) {
    return this.show('success', title, message, options);
  }

  error(title, message, options) {
    return this.show('error', title, message, { ...options, duration: 8000 }); // Erros ficam mais tempo
  }

  warning(title, message, options) {
    return this.show('warning', title, message, options);
  }

  info(title, message, options) {
    return this.show('info', title, message, options);
  }

  // Confirm personalizado com modal
  confirm(title, message, onConfirm, onCancel, type = 'warning') {
    return new Promise((resolve) => {
      let settled = false;
      const resolveOnce = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      // Remover modal existente se houver
      this.closeModal();
      
      // Criar overlay do modal
      const overlay = document.createElement('div');
      overlay.className = 'confirm-modal-overlay';
      overlay.innerHTML = `
        <div class="confirm-modal ${type}">
          <div class="confirm-modal-header">
            <div class="confirm-modal-icon">
              ${type === 'danger' ? '✕' : type === 'warning' ? '!' : 'i'}
            </div>
            <h3 class="confirm-modal-title">${this.escapeHtml(title)}</h3>
          </div>
          <div class="confirm-modal-body">
            <p class="confirm-modal-message">${this.escapeHtml(message)}</p>
          </div>
          <div class="confirm-modal-footer">
            <button type="button" class="confirm-modal-btn confirm-modal-btn-cancel">
              Cancelar
            </button>
            <button type="button" class="confirm-modal-btn confirm-modal-btn-confirm">
              Confirmar
            </button>
          </div>
        </div>
      `;
      
      // Adicionar ao DOM
      document.body.appendChild(overlay);
      
      // Guardar referência
      this.currentModal = overlay;
      
      // Mostrar com animação
      setTimeout(() => {
        overlay.classList.add('show');
      }, 10);
      
      // Configurar eventos
      const cancelBtn = overlay.querySelector('.confirm-modal-btn-cancel');
      const confirmBtn = overlay.querySelector('.confirm-modal-btn-confirm');
      
      const handleCancel = () => {
        this.closeModal();
        if (onCancel) onCancel();
        resolveOnce(false);
      };
      
      const handleConfirm = () => {
        this.closeModal();
        if (onConfirm) onConfirm();
        resolveOnce(true);
      };
      
      // Eventos dos botões
      cancelBtn.addEventListener('click', handleCancel);
      confirmBtn.addEventListener('click', handleConfirm);
      
      // Evento do overlay (fechar ao clicar fora)
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });
      
      // Evento ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      // Guardar handlers para limpeza
      overlay._cancelHandler = handleCancel;
      overlay._confirmHandler = handleConfirm;
      overlay._escapeHandler = handleEscape;
    });
  }
  
  // Fechar modal atual
  closeModal() {
    if (this.currentModal) {
      const overlay = this.currentModal;
      
      // Remover event listeners
      if (overlay._escapeHandler) {
        document.removeEventListener('keydown', overlay._escapeHandler);
      }
      
      // Animar saída
      overlay.classList.remove('show');
      
      // Remover do DOM após animação
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
      
      this.currentModal = null;
    }
  }

  // Limpar todos os alertas
  clear() {
    // Fechar modal se existir
    this.closeModal();
    
    // Limpar alertas
    this.alerts.forEach(alertData => {
      if (alertData.timer) {
        clearTimeout(alertData.timer);
      }
      if (alertData.element.parentNode) {
        alertData.element.parentNode.removeChild(alertData.element);
      }
    });
    this.alerts = [];
  }

  // Utilitário para escapar HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Instância global
const alertSystem = new AlertSystem();

// Funções globais de conveniência
window.showAlert = (type, title, message, options) => alertSystem.show(type, title, message, options);
window.showSuccess = (title, message, options) => alertSystem.success(title, message, options);
window.showError = (title, message, options) => alertSystem.error(title, message, options);
window.showWarning = (title, message, options) => alertSystem.warning(title, message, options);
window.showInfo = (title, message, options) => alertSystem.info(title, message, options);
window.showConfirm = (title, message, onConfirm, onCancel, type) => alertSystem.confirm(title, message, onConfirm, onCancel, type);

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlertSystem;
}
