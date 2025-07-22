#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧠 Configurando Tech AI Agent...\n');

// Crear directorios necesarios
const directories = [
    'uploads',
    'uploads/images',
    'uploads/audio',
    'uploads/videos',
    'uploads/code',
    'temp',
    'assets',
    'assets/music',
    'assets/sounds',
    'logs',
    'public/js/functions'
];

console.log('📁 Creando estructura de directorios...');
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Creado: ${dir}`);
    } else {
        console.log(`⏭️  Ya existe: ${dir}`);
    }
});

// Verificar archivo .env
console.log('\n🔧 Verificando configuración de variables de entorno...');
if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ Archivo .env creado desde .env.example');
        console.log('⚠️  IMPORTANTE: Configura tus API keys en el archivo .env');
    } else {
        // Crear .env básico si no existe .env.example
        const envContent = `# API Keys - Configura con tus claves reales
OPENAI_API_KEY=tu_clave_openai_aqui
ELEVENLABS_API_KEY=tu_clave_elevenlabs_aqui

# Configuración del servidor
PORT=3000
NODE_ENV=development

# URLs de las APIs
OPENAI_API_URL=https://api.openai.com/v1
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1
`;
        fs.writeFileSync('.env', envContent);
        console.log('✅ Archivo .env creado con configuración básica');
    }
} else {
    console.log('✅ Archivo .env ya existe');
}

// Verificar FFmpeg
console.log('\n🎬 Verificando FFmpeg...');
try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('✅ FFmpeg está instalado y disponible');
} catch (error) {
    console.log('❌ FFmpeg no está instalado o no está en el PATH');
    console.log('\n📋 Para instalar FFmpeg:');
    console.log('Windows: choco install ffmpeg');
    console.log('macOS: brew install ffmpeg');
    console.log('Linux: sudo apt install ffmpeg');
    console.log('Docker: FFmpeg se incluirá automáticamente');
    console.log('Railway: FFmpeg está preinstalado');
}

// Verificar Node.js version
console.log('\n📦 Verificando versión de Node.js...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 18) {
    console.log(`✅ Node.js ${nodeVersion} (compatible)`);
} else {
    console.log(`⚠️  Node.js ${nodeVersion} (se recomienda v18 o superior)`);
}

// Crear archivos de configuración adicionales
console.log('\n⚙️ Creando archivos de configuración...');

// Crear archivo de configuración para Railway
const railwayConfig = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
        "builder": "NIXPACKS"
    },
    "deploy": {
        "startCommand": "npm start",
        "healthcheckPath": "/health",
        "healthcheckTimeout": 100,
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
    }
};

fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
console.log('✅ railway.json creado');

// Crear Dockerfile optimizado
const dockerfileContent = `# Usar Node.js 18 como base
FROM node:18-slim

# Instalar FFmpeg y dependencias del sistema
RUN apt-get update && apt-get install -y \\
    ffmpeg \\
    python3 \\
    python3-pip \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Ejecutar setup
RUN node setup.js

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
`;

fs.writeFileSync('Dockerfile', dockerfileContent);
console.log('✅ Dockerfile creado');

// Crear .dockerignore
const dockerignoreContent = `node_modules
npm-debug.log
.env
.git
.gitignore
README.md
uploads
temp
logs
*.log
.DS_Store
Thumbs.db
`;

fs.writeFileSync('.dockerignore', dockerignoreContent);
console.log('✅ .dockerignore creado');

// Verificar variables de entorno críticas
console.log('\n🔑 Verificando configuración de API keys...');
require('dotenv').config();

const requiredEnvVars = [
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY'
];

let missingVars = [];

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('tu_clave_') || value.includes('aqui')) {
        missingVars.push(varName);
        if (varName === 'OPENAI_API_KEY') {
            console.log(`❌ ${varName} (DALL-E 2 + GPT-4o-mini): No configurada`);
        } else if (varName === 'ELEVENLABS_API_KEY') {
            console.log(`❌ ${varName} (Síntesis de Voz): No configurada`);
        }
    } else {
        if (varName === 'OPENAI_API_KEY') {
            console.log(`✅ ${varName} (DALL-E 2 + GPT-4o-mini): Configurada`);
        } else if (varName === 'ELEVENLABS_API_KEY') {
            console.log(`✅ ${varName} (Síntesis de Voz): Configurada`);
        }
    }
});

// Crear archivo de ejemplo de configuración
const configExample = {
    "name": "Tech AI Agent",
    "version": "1.0.0",
    "features": {
        "images": {
            "enabled": true,
            "defaultSize": "1024x1024",
            "maxBatchSize": 10
        },
        "videos": {
            "enabled": true,
            "defaultQuality": "hd",
            "maxDuration": 300
        },
        "code": {
            "enabled": true,
            "supportedLanguages": ["javascript", "python", "html", "css", "bash"],
            "includeTests": true
        },
        "automation": {
            "enabled": true,
            "maxActiveAutomations": 50,
            "cronEnabled": true
        },
        "chat": {
            "enabled": true,
            "model": "gpt-4o-mini",
            "maxTokens": 1000
        }
    },
    "limits": {
        "maxFileSize": "50MB",
        "maxConcurrentTasks": 5,
        "rateLimiting": true
    }
};

fs.writeFileSync('config.example.json', JSON.stringify(configExample, null, 2));
console.log('✅ config.example.json creado');

// Crear script de inicio para desarrollo
const devScript = `#!/bin/bash
echo "🧠 Iniciando Tech AI Agent en modo desarrollo..."

# Verificar variables de entorno
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado"
    echo "Copia .env.example a .env y configura tus API keys"
    exit 1
fi

# Verificar FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg no encontrado, algunas funciones de video pueden no funcionar"
fi

# Iniciar servidor
npm run dev
`;

fs.writeFileSync('dev.sh', devScript);
try {
    fs.chmodSync('dev.sh', '755');
} catch (error) {
    // Ignorar error en Windows
}
console.log('✅ dev.sh creado');

// Crear script de producción
const prodScript = `#!/bin/bash
echo "🚀 Iniciando Tech AI Agent en modo producción..."

# Verificar variables de entorno críticas
if [ -z "$OPENAI_API_KEY" ] || [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "❌ Variables de entorno críticas no configuradas"
    exit 1
fi

# Iniciar servidor
npm start
`;

fs.writeFileSync('prod.sh', prodScript);
try {
    fs.chmodSync('prod.sh', '755');
} catch (error) {
    // Ignorar error en Windows
}
console.log('✅ prod.sh creado');

// Resumen final
console.log('\n🎉 Configuración completada!\n');

console.log('📋 Resumen:');
console.log(`✅ Directorios creados: ${directories.length}`);
console.log('✅ Archivos de configuración creados');
console.log('✅ Scripts de inicio creados');

if (missingVars.length > 0) {
    console.log('\n⚠️  IMPORTANTE: Configura tus API keys para usar Tech completamente');
    console.log('\n📋 APIs requeridas:');
    missingVars.forEach(varName => {
        if (varName === 'OPENAI_API_KEY') {
            console.log(`   🤖 ${varName} - Para DALL-E 2 y GPT-4o-mini`);
        } else if (varName === 'ELEVENLABS_API_KEY') {
            console.log(`   🗣️  ${varName} - Para síntesis de voz`);
        }
    });
    console.log('\n🔗 Enlaces para obtener API keys:');
    console.log('   🤖 OpenAI: https://platform.openai.com/api-keys');
    console.log('   🗣️  ElevenLabs: https://elevenlabs.io/app/settings/api-keys');
    console.log('\n📖 Guía detallada: Lee el archivo API_SETUP.md');
    console.log('\n💰 Costos aproximados:');
    console.log('   • DALL-E 2: ~$0.02 por imagen (1024x1024)');
    console.log('   • GPT-4o-mini: ~$0.15 por 1M tokens');
    console.log('   • ElevenLabs: Plan gratuito 10,000 caracteres/mes');
}

console.log('\n🚀 Para iniciar la aplicación:');
console.log('   Desarrollo: npm run dev');
console.log('   Producción: npm start');
console.log('   Con Docker: docker build -t tech-ai . && docker run -p 3000:3000 tech-ai');

console.log('\n🌐 Una vez iniciado, visita: http://localhost:3000');

console.log('\n📚 Para desplegar en Railway:');
console.log('1. Sube el código a GitHub');
console.log('2. Conecta el repositorio en Railway.app');
console.log('3. Configura las variables de entorno en Railway');
console.log('4. ¡Deploy automático!');

console.log('\n✨ ¡Tech AI Agent está listo para usar!');