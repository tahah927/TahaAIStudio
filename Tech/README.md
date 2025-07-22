# 🧠 Tech - Agente de IA Todo en Uno

Una aplicación web moderna que funciona como un agente de inteligencia artificial completo, ofreciendo múltiples funciones inteligentes y creativas integradas en una interfaz atractiva y fluida.

## ✨ Características Principales

### 🎨 Generación de Imágenes (DALL-E 2)
- Generación individual y por lotes
- Múltiples tamaños: 1024x1024, 512x512, 256x256
- Galería interactiva con vista previa
- Descarga y gestión de imágenes

### 🎬 Creación de Videos con IA
- Generación automática de guiones con GPT-4o-mini
- Creación de imágenes para escenas con DALL-E 2
- Síntesis de voz realista con ElevenLabs
- Ensamblaje automático con transiciones y música
- Múltiples formatos: 16:9, 9:16, 1:1
- Calidades: HD, Full HD, 4K

### 💻 Escritura de Código Inteligente
- Generación de código en múltiples lenguajes (Python, JS, HTML/CSS, Bash)
- Revisión y mejora de código existente
- Explicaciones paso a paso
- Generación automática de tests

### 🔁 Automatización de Tareas
- Creación de workflows complejos
- Integración con APIs externas
- Tareas programadas (cron jobs)
- Webhooks y triggers personalizados

### 💬 Chat General Inteligente
- Conversaciones con personalidad "Tech" profesional y amigable
- Historial de conversaciones
- Sugerencias contextuales
- Adaptación al estilo del usuario

## 🔑 **CONFIGURACIÓN DE API KEYS**

### **Paso 1: Obtener las API Keys**

#### 🤖 **OpenAI (DALL-E 2 + GPT-4o-mini)**
1. Ve a: **https://platform.openai.com/api-keys**
2. Inicia sesión o crea una cuenta
3. Haz clic en **"Create new secret key"**
4. Copia la clave (empieza con `sk-`)
5. **Importante**: Necesitas créditos en tu cuenta OpenAI

#### 🗣️ **ElevenLabs (Síntesis de Voz)**
1. Ve a: **https://elevenlabs.io/app/settings/api-keys**
2. Inicia sesión o crea una cuenta
3. Copia tu API key
4. **Nota**: Tienen plan gratuito con 10,000 caracteres/mes

### **Paso 2: Configurar las API Keys**

#### **🏠 Para Desarrollo Local:**

1. **Crea el archivo `.env`** en la raíz del proyecto:

```env
# ===========================================
# TECH AI AGENT - CONFIGURACIÓN DE APIs
# ===========================================

# 🔑 API KEYS (REQUERIDAS)
OPENAI_API_KEY=sk-tu_clave_openai_real_aqui
ELEVENLABS_API_KEY=tu_clave_elevenlabs_real_aqui

# ⚙️ Configuración del Servidor
PORT=3000
NODE_ENV=development

# 🌐 URLs de APIs (NO CAMBIAR)
OPENAI_API_URL=https://api.openai.com/v1
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1
```

2. **Reemplaza las claves** con tus API keys reales

#### **☁️ Para Despliegue en Railway:**

En Railway.app, ve a tu proyecto → **Variables** y agrega:

```
OPENAI_API_KEY = sk-tu_clave_openai_real_aqui
ELEVENLABS_API_KEY = tu_clave_elevenlabs_real_aqui
PORT = 3000
NODE_ENV = production
OPENAI_API_URL = https://api.openai.com/v1
ELEVENLABS_API_URL = https://api.elevenlabs.io/v1
```

### **Paso 3: Verificar Configuración**

El proyecto verifica automáticamente las API keys al iniciar:

```bash
🔑 Verificando configuración de API keys...
✅ OPENAI_API_KEY: Configurada
✅ ELEVENLABS_API_KEY: Configurada
🚀 Tech AI Agent ejecutándose en puerto 3000
```

## 🚀 Instalación y Uso

### **Desarrollo Local**

```bash
# 1. Clona el proyecto
git clone <tu-repositorio>
cd tech-ai-agent

# 2. Instala dependencias
npm install

# 3. Configura API keys (ver sección anterior)
cp .env.example .env
# Edita .env con tus API keys

# 4. Ejecuta setup automático
npm run postinstall

# 5. Inicia la aplicación
npm run dev
```

### **Despliegue en Railway**

1. **Sube el código a GitHub**
2. **Conecta el repositorio** en Railway.app
3. **Configura las variables de entorno** (ver sección API Keys)
4. **¡Deploy automático!**

## 🛠️ Tecnologías Utilizadas

### **Backend:**
- Node.js + Express
- Socket.IO (tiempo real)
- FFmpeg (procesamiento de video)
- Sharp (procesamiento de imágenes)
- Cron jobs (automatización)

### **Frontend:**
- HTML5, CSS3, JavaScript vanilla
- Diseño modular y componentes reutilizables
- WebSockets para comunicación en tiempo real
- Interfaz inspirada en ChatGPT

### **APIs Integradas:**
- **OpenAI**: DALL-E 2, GPT-4o-mini
- **ElevenLabs**: Síntesis de voz

## 💰 Costos Aproximados

### **OpenAI:**
- **DALL-E 2**: ~$0.02 por imagen (1024x1024)
- **GPT-4o-mini**: ~$0.15 por 1M tokens de entrada

### **ElevenLabs:**
- **Plan gratuito**: 10,000 caracteres/mes
- **Plan Creator**: $5/mes por 30,000 caracteres

## 📁 Estructura del Proyecto

```
tech-ai-agent/
├── .env                    # ← TUS API KEYS AQUÍ
├── .env.example           # Plantilla de ejemplo
├── server.js              # Servidor principal
├── setup.js               # Configuración automática
├── package.json           # Dependencias
├── Dockerfile             # Para containerización
├── railway.json           # Configuración de Railway
├── public/                # Frontend
│   ├── index.html         # Interfaz principal
│   ├── styles/            # CSS organizado
│   └── js/                # JavaScript modular
└── routes/                # APIs del backend
    ├── images.js          # Generación de imágenes (DALL-E 2)
    ├── videos.js          # Creación de videos
    ├── code.js            # Escritura de código
    ├── automation.js      # Automatización
    └── chat.js            # Chat general
```

## 🎯 Funcionalidades Detalladas

### **📸 Generación de Imágenes**
- **Prompts inteligentes** con sugerencias
- **Generación individual** o por lotes
- **Múltiples tamaños** optimizados para DALL-E 2
- **Galería interactiva** con vista previa
- **Descarga masiva** de imágenes

### **🎥 Creación de Videos**
- **Guiones automáticos** generados por IA
- **Imágenes de escenas** creadas con DALL-E 2
- **Narración realista** con ElevenLabs
- **Ensamblaje automático** con FFmpeg
- **Múltiples formatos** y calidades

### **💻 Código Inteligente**
- **Generación** en Python, JavaScript, HTML/CSS, Bash
- **Revisión y mejora** de código existente
- **Explicaciones detalladas** paso a paso
- **Tests automáticos** para el código generado

### **🔁 Automatización**
- **Workflows personalizados** con múltiples pasos
- **Integración con APIs** externas
- **Tareas programadas** con cron
- **Webhooks** y triggers en tiempo real

## 🔧 Configuración Avanzada

### **Personalización de Tech**
```javascript
// En routes/chat.js - Personalidad de Tech
const TECH_PERSONALITY = {
  name: "Tech",
  role: "Agente de IA especializado y amigable",
  // Personaliza aquí la personalidad
};
```

### **Límites y Configuración**
```json
// En config.example.json
{
  "limits": {
    "maxFileSize": "50MB",
    "maxConcurrentTasks": 5,
    "rateLimiting": true
  }
}
```

## 🐛 Solución de Problemas

### **Error: API Key inválida**
- Verifica que las API keys sean correctas
- Asegúrate de tener créditos en OpenAI y ElevenLabs
- Revisa que las variables de entorno estén configuradas

### **Error: FFmpeg no encontrado**
```bash
# Verificar instalación
ffmpeg -version

# Instalar FFmpeg
# Windows: choco install ffmpeg
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

### **Error: Memoria insuficiente**
- Reduce la calidad del video
- Usa menos imágenes por video
- Considera usar un plan superior en Railway

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas:

1. **Revisa la sección de solución de problemas**
2. **Verifica que las API keys estén configuradas correctamente**
3. **Asegúrate de que todas las dependencias estén instaladas**
4. **Consulta los logs del servidor** para errores específicos

## 🔮 Próximas Características

- [ ] Soporte para más modelos de IA
- [ ] Editor de video más avanzado
- [ ] Plantillas predefinidas
- [ ] Integración con más servicios de voz
- [ ] Exportación en múltiples formatos
- [ ] Sistema de usuarios y proyectos guardados
- [ ] Integración con DALL-E 3 (opcional)

---

¡Disfruta creando contenido increíble con **Tech**! 🧠✨

**¿Necesitas ayuda?** Asegúrate de configurar correctamente tus API keys siguiendo la guía anterior.