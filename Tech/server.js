const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

// Importar rutas
const imageRoutes = require('./routes/images');
const videoRoutes = require('./routes/videos');
const codeRoutes = require('./routes/code');
const automationRoutes = require('./routes/automation');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/assets', express.static('assets'));

// Crear directorios necesarios
const createDirectories = async () => {
  const dirs = [
    'uploads/images',
    'uploads/audio', 
    'uploads/videos',
    'uploads/code',
    'temp',
    'assets/music',
    'assets/sounds',
    'logs'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// Configurar Socket.IO para comunicación en tiempo real
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
  
  // Eventos para progreso en tiempo real
  socket.on('join-task', (taskId) => {
    socket.join(taskId);
    console.log(`📋 Cliente ${socket.id} se unió a la tarea: ${taskId}`);
  });
});

// Hacer io disponible globalmente para las rutas
app.set('io', io);

// Rutas de la API
app.use('/api/images', imageRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/chat', chatRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Iniciar servidor
const startServer = async () => {
  try {
    await createDirectories();
    
    server.listen(PORT, () => {
      console.log(`🚀 Tech AI Agent ejecutándose en puerto ${PORT}`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: Habilitado`);
      console.log(`📊 Modo: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales del sistema
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

startServer();