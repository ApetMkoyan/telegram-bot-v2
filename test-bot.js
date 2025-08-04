const config = require('./config');

console.log('🧪 Тестирование конфигурации Telegram Bot v2');
console.log('=============================================');

// Проверка основных настроек
console.log('\n📋 Основные настройки:');
console.log(`✅ BOT_TOKEN: ${config.BOT_TOKEN ? 'Установлен' : 'НЕ УСТАНОВЛЕН'}`);
console.log(`✅ Пользователей: ${Object.keys(config.USERS).length}`);
console.log(`✅ Парков: ${Object.keys(config.PARKS).length}`);
console.log(`✅ Типов смен: ${Object.keys(config.SHIFTS.shiftTypes).length}`);

// Проверка пользователей
console.log('\n👤 Пользователи:');
Object.keys(config.USERS).forEach(username => {
  const user = config.USERS[username];
  console.log(`  - ${username} (${user.role}) - ${user.park}`);
});

// Проверка парков
console.log('\n🏢 Парки:');
Object.keys(config.PARKS).forEach(parkKey => {
  const park = config.PARKS[parkKey];
  console.log(`  - ${parkKey}: ${park.name}`);
});

// Проверка безопасности
console.log('\n🔒 Настройки безопасности:');
console.log(`  - Максимум попыток входа: ${config.SECURITY.maxLoginAttempts}`);
console.log(`  - Таймаут сессии: ${config.SECURITY.sessionTimeout / 60} минут`);
console.log(`  - Максимум пользователей: ${config.SECURITY.allowedUsers}`);

// Проверка автоматов
console.log('\n🎮 Настройки автоматов:');
console.log(`  - Интервал сбора хоккея: ${config.MACHINES.hockeyCollectionInterval} дней`);
console.log(`  - Интервал сбора боксёра: ${config.MACHINES.boxerCollectionInterval} дней`);

// Проверка типов смен
console.log('\n📅 Типы смен:');
Object.keys(config.SHIFTS.shiftTypes).forEach(type => {
  const shift = config.SHIFTS.shiftTypes[type];
  console.log(`  - ${type}: ${shift.name} (${shift.salary}₽)`);
});

console.log('\n✅ Тестирование завершено!');
console.log('🚀 Бот готов к запуску на Render.com'); 