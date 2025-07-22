# 🔑 Configuración de APIs para Tech AI Agent

Esta guía te ayudará a configurar correctamente las API keys necesarias para que **Tech** funcione completamente.

## 📋 APIs Requeridas

### 1. 🤖 OpenAI (DALL-E 2 + GPT-4o-mini)
- **Función**: Generación de imágenes, escritura de código, chat, guiones de video
- **Costo**: DALL-E 2 (~$0.02 por imagen), GPT-4o-mini (~$0.15 por 1M tokens)
- **Registro**: https://platform.openai.com/

### 2. 🗣️ ElevenLabs (Síntesis de Voz)
- **Función**: Generación de audio para videos y narración
- **Costo**: Plan gratuito (10,000 caracteres/mes), Plan Creator ($5/mes)
- **Registro**: https://elevenlabs.io/

## 🚀 Configuración Paso a Paso

### Paso 1: Obtener API Key de OpenAI

1. **Ve a**: https://platform.openai.com/api-keys
2. **Inicia sesión** o crea una cuenta nueva
3. **Haz clic** en "Create new secret key"
4. **Nombra tu clave** (ej: "Tech AI Agent")
5. **Copia la clave** (empieza con `sk-proj-` o `sk-`)
6. **⚠️ Importante**: Guarda la clave inmediatamente, no podrás verla después

#### Configurar Créditos en OpenAI:
1. Ve a **Billing**: https://platform.openai.com/account/billing
2. **Agrega un método de pago**
3. **Establece un límite** de gasto (recomendado: $10-20 para empezar)

### Paso 2: Obtener API Key de ElevenLabs

1. **Ve a**: https://elevenlabs.io/app/settings/api-keys
2. **Inicia sesión** o crea una cuenta nueva
3. **Copia tu API key** (se muestra automáticamente)
4. **Opcional**: Actualiza a plan pagado para más caracteres

### Paso 3: Configurar las Claves en tu Proyecto

#### 🏠 Para Desarrollo Local:

1. **Crea el archivo `.env`** en la raíz del proyecto:
```bash
cp .env.example .env
```

2. **Edita el archivo `.env`** con tus claves reales:
```env
# Reemplaza con tus claves reales
OPENAI_API_KEY=sk-proj-tu_clave_real_de_openai_aqui
ELEVENLABS_API_KEY=tu_clave_real_de_elevenlabs_aqui

# El resto de la configuración no cambiar
PORT=3000
NODE_ENV=development
OPENAI_API_URL=https://api.openai.com/v1
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1
```

3. **Guarda el archivo** y continúa con la instalación

#### ☁️ Para Despliegue en Railway:

1. **Ve a tu proyecto** en Railway.app
2. **Haz clic** en la pestaña "Variables"
3. **Agrega estas variables**:

| Variable | Valor |
|----------|-------|
| `OPENAI_API_KEY` | `sk-proj-tu_clave_real_de_openai_aqui` |
| `ELEVENLABS_API_KEY` | `tu_clave_real_de_elevenlabs_aqui` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `OPENAI_API_URL` | `https://api.openai.com/v1` |
| `ELEVENLABS_API_URL` | `https://api.elevenlabs.io/v1` |

4. **Guarda** y redespliega el proyecto

## ✅ Verificar Configuración

### Verificación Automática
Cuando inicies Tech, verás:
```bash
🔑 Verificando configuración de API keys...
✅ OPENAI_API_KEY: Configurada
✅ ELEVENLABS_API_KEY: Configurada
🚀 Tech AI Agent ejecutándose en puerto 3000
```

### Verificación Manual

#### Probar OpenAI:
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### Probar ElevenLabs:
```bash
curl -H "xi-api-key: $ELEVENLABS_API_KEY" \
     https://api.elevenlabs.io/v1/voices
```

## 💰 Gestión de Costos

### OpenAI - Costos por Función:
- **Imágenes DALL-E 2**:
  - 1024x1024: ~$0.020
  - 512x512: ~$0.018  
  - 256x256: ~$0.016
- **Chat GPT-4o-mini**: ~$0.15 por 1M tokens de entrada
- **Generación de código**: ~$0.10-0.50 por solicitud

### ElevenLabs - Costos por Plan:
- **Gratuito**: 10,000 caracteres/mes
- **Starter**: $5/mes - 30,000 caracteres
- **Creator**: $22/mes - 100,000 caracteres

### Consejos para Ahorrar:
1. **Usa imágenes más pequeñas** (512x512) para pruebas
2. **Limita la longitud** de los prompts de chat
3. **Configura límites** de gasto en OpenAI
4. **Monitorea el uso** regularmente

## 🔒 Seguridad de las APIs

### ⚠️ Reglas Importantes:
1. **NUNCA** subas el archivo `.env` a GitHub
2. **NO** compartas tus API keys con nadie
3. **USA** variables de entorno en producción
4. **ROTA** las claves si sospechas compromiso
5. **CONFIGURA** límites de gasto

### Archivo .gitignore:
El proyecto incluye automáticamente:
```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🐛 Solución de Problemas

### Error: "API key not found"
- ✅ Verifica que el archivo `.env` existe
- ✅ Confirma que las claves están correctamente copiadas
- ✅ Reinicia el servidor después de cambiar `.env`

### Error: "Insufficient quota"
- ✅ Verifica que tienes créditos en OpenAI
- ✅ Revisa tu límite de gasto
- ✅ Agrega un método de pago válido

### Error: "Invalid API key"
- ✅ Regenera la API key en la plataforma
- ✅ Verifica que no hay espacios extra
- ✅ Confirma que la clave no ha expirado

### Error: "Rate limit exceeded"
- ✅ Espera unos minutos antes de reintentar
- ✅ Reduce la frecuencia de solicitudes
- ✅ Considera actualizar tu plan

## 📞 Soporte

### OpenAI:
- **Documentación**: https://platform.openai.com/docs
- **Soporte**: https://help.openai.com/
- **Estado del servicio**: https://status.openai.com/

### ElevenLabs:
- **Documentación**: https://docs.elevenlabs.io/
- **Soporte**: https://elevenlabs.io/support
- **Discord**: https://discord.gg/elevenlabs

## 🎯 Próximos Pasos

Una vez configuradas las APIs:

1. **Ejecuta**: `npm install`
2. **Inicia**: `npm start`
3. **Visita**: http://localhost:3000
4. **Prueba** cada función:
   - 📸 Genera una imagen
   - 🎥 Crea un video corto
   - 💻 Escribe código
   - 💬 Chatea con Tech

¡Ya tienes **Tech** completamente configurado y listo para usar! 🚀