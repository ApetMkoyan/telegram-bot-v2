const TelegramBot = require('node-telegram-bot-api');

const token = '8436258079:AAHX3XC9gzVqNePcIbcxAR0dgai-urpenvk';

console.log('🧪 Тестирование нового токена бота...');

try {
  const bot = new TelegramBot(token, { polling: false });
  
  // Получаем информацию о боте
  bot.getMe().then((botInfo) => {
    console.log('✅ Новый токен работает!');
    console.log(`🤖 Имя бота: ${botInfo.first_name}`);
    console.log(`👤 Username: @${botInfo.username}`);
    console.log(`🆔 ID бота: ${botInfo.id}`);
    console.log(`📝 Описание: ${botInfo.description || 'Не указано'}`);
    
    console.log('\n🎉 Новый токен готов к использованию!');
    console.log('🚀 Можно настраивать развертывание на Render.com');
    
  }).catch((error) => {
    console.log('❌ Ошибка с токеном:', error.message);
    console.log('💡 Проверьте токен или создайте нового бота через @BotFather');
  });
  
} catch (error) {
  console.log('❌ Ошибка инициализации бота:', error.message);
} 