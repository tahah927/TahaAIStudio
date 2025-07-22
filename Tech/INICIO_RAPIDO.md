# 🚀 Inicio Rápido - Tech AI Agent

## 📋 Checklist de Configuración

### ✅ Paso 1: Obtener API Keys

#### 🤖 OpenAI (DALL-E 2 + GPT-4o-mini)
- [ ] Ve a: https://platform.openai.com/api-keys
- [ ] Crea una cuenta o inicia sesión
- [ ] Haz clic en "Create new secret key"
- [ ] Copia la clave (empieza con `sk-`)
- [ ] Agrega créditos en: https://platform.openai.com/account/billing

#### 🗣️ ElevenLabs (Síntesis de Voz)
- [ ] Ve a: https://elevenlabs.io/app/settings/api-keys
- [ ] Crea una cuenta o inicia sesión
- [ ] Copia tu API key
- [ ] (Opcional) Actualiza a plan pagado para más caracteres

### ✅ Paso 2: Configurar el Proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Editar .env con tus API keys reales
# Reemplaza:
# OPENAI_API_KEY=sk-tu_clave_openai_real_aqui
# ELEVENLABS_API_KEY=tu_clave_elevenlabs_real_aqui

# 4. Ejecutar configuración automática
npm run postinstall

# 5. Iniciar la aplicación
npm start
```

### ✅ Paso 3: Verificar Funcionamiento

1. **Abre tu navegador** en: http://localhost:3000
2. **Prueba cada función**:
   - 📸 Genera una imagen con DALL-E 2
   - 🎥 Crea un video corto
   - 💻 Escribe código
   - 💬 Chatea con Tech
   - 🔁 Crea una automatización

## 🔧 Configuración del Archivo .env

```env
# ===========================================
# TECH AI AGENT - CONFIGURACIÓN
# ===========================================

# 🔑 API KEYS (REEMPLAZA CON TUS CLAVES REALES)
OPENAI_API_KEY=sk-proj-tu_clave_real_de_openai_aqui
ELEVENLABS_API_KEY=tu_clave_real_de_elevenlabs_aqui

# ⚙️ Configuración del Servidor (NO CAMBIAR)
PORT=3000
NODE_ENV=development
OPENAI_API_URL=https://api.openai.com/v1
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1
```

## 🌐 Despliegue en Railway

### Opción 1: Desde GitHub
1. **Sube el código** a un repositorio de GitHub
2. **Ve a Railway.app** y conecta tu repositorio
3. **Configura las variables de entorno**:
   - `OPENAI_API_KEY` = tu clave real de OpenAI
   - `ELEVENLABS_API_KEY` = tu clave real de ElevenLabs
   - `PORT` = 3000
   - `NODE_ENV` = production
4. **Deploy automático** ✨

### Opción 2: Railway CLI
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init
railway up
```

## 💰 Costos Estimados

### OpenAI:
- **DALL-E 2**: ~$0.02 por imagen (1024x1024)
- **GPT-4o-mini**: ~$0.15 por 1M tokens
- **Presupuesto recomendado**: $10-20 para empezar

### ElevenLabs:
- **Plan gratuito**: 10,000 caracteres/mes
- **Plan Creator**: $5/mes por 30,000 caracteres

## 🐛 Solución de Problemas Comunes

### ❌ Error: "API key not found"
```bash
# Verifica que el archivo .env existe y tiene las claves
cat .env

# Reinicia el servidor después de cambiar .env
npm start
```

### ❌ Error: "Insufficient quota" (OpenAI)
- Verifica que tienes créditos en tu cuenta OpenAI
- Ve a: https://platform.openai.com/account/billing
- Agrega un método de pago y establece un límite

### ❌ Error: FFmpeg no encontrado
```bash
# Windows
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

### ❌ Error: Puerto 3000 en uso
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en puerto 3000
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -ti:3000 | xargs kill
```

## 📱 Funciones Principales

### 📸 Generación de Imágenes
- **Modelo**: DALL-E 2
- **Tamaños**: 1024x1024, 512x512, 256x256
- **Funciones**: Individual, por lotes, galería

### 🎥 Creación de Videos
- **Guiones**: Generados automáticamente con GPT-4o-mini
- **Imágenes**: Creadas con DALL-E 2 para cada escena
- **Audio**: Síntesis de voz con ElevenLabs
- **Formatos**: 16:9, 9:16, 1:1
- **Calidades**: HD, Full HD, 4K

### 💻 Escritura de Código
- **Lenguajes**: JavaScript, Python, HTML/CSS, Bash
- **Funciones**: Generación, revisión, explicación, tests

### 🔁 Automatización
- **Tipos**: Cron jobs, webhooks, manual
- **Integraciones**: APIs externas, procesamiento de datos

### 💬 Chat Inteligente
- **Modelo**: GPT-4o-mini
- **Personalidad**: "Tech" - profesional y amigable
- **Funciones**: Historial, sugerencias contextuales

## 📞 Soporte

### 📖 Documentación Completa:
- `README.md` - Guía completa del proyecto
- `API_SETUP.md` - Configuración detallada de APIs

### 🔗 Enlaces Útiles:
- **OpenAI Docs**: https://platform.openai.com/docs
- **ElevenLabs Docs**: https://docs.elevenlabs.io/
- **Railway Docs**: https://docs.railway.app/

### 🆘 Si necesitas ayuda:
1. Revisa los archivos de documentación
2. Verifica que las API keys estén correctas
3. Consulta los logs del servidor para errores específicos

---

¡**Tech** está listo para usar! 🧠✨

**Próximo paso**: Abre http://localhost:3000 y comienza a crear contenido increíble con IA.