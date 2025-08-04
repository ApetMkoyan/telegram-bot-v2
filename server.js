const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Импорт бота (без автоматического запуска)
const bot = require('./bot');

// Простой маршрут для проверки здоровья сервиса
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Telegram Bot v2 is running',
    timestamp: new Date().toISOString()
  });
});

// Маршрут для проверки статуса бота
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bot: 'running',
    uptime: process.uptime()
  });
});

// Запуск сервера
app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Веб-сервер запущен на порту ${port}`);
  // Запускаем бота после запуска сервера
  console.log('🎯 Запуск бота в режиме polling...');
  bot.startPolling();
});

module.exports = app; 