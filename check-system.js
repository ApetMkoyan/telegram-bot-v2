const fs = require('fs');
const path = require('path');
const config = require('./config');

console.log('🔍 Проверка системы...\n');

// Проверка конфигурации
console.log('📋 Конфигурация:');
console.log(`  • Парки: ${Object.keys(config.PARKS).length}`);
Object.keys(config.PARKS).forEach(park => {
  console.log(`    - ${park}: ${config.PARKS[park].name}`);
});

console.log(`  • Пользователи: ${Object.keys(config.USERS).length}`);
console.log(`  • Типы смен: ${Object.keys(config.SHIFTS.shiftTypes).length}`);

// Проверка данных
const dataFile = config.DATA_SETTINGS.dataFile;
if (fs.existsSync(dataFile)) {
  const data = JSON.parse(fs.readFileSync(dataFile));
  console.log('\n📊 Данные:');
  
  Object.keys(data).forEach(park => {
    const employees = data[park]?.employees || [];
    const shifts = data[park]?.shifts || {};
    console.log(`  • ${park}: ${employees.length} сотрудников`);
    
    if (employees.length > 0) {
      console.log(`    Работают сегодня: ${employees.filter(emp => {
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const employeeShifts = shifts[emp] || Array(7).fill('');
        const todayShift = employeeShifts[dayOfWeek] || '';
        return todayShift && todayShift !== 'вых';
      }).length}`);
    }
  });
} else {
  console.log('\n❌ Файл данных не найден!');
}

// Проверка зависимостей
console.log('\n📦 Зависимости:');
try {
  require('node-telegram-bot-api');
  console.log('  ✅ node-telegram-bot-api');
} catch (e) {
  console.log('  ❌ node-telegram-bot-api');
}

try {
  require('moment');
  console.log('  ✅ moment');
} catch (e) {
  console.log('  ❌ moment');
}

try {
  require('dotenv');
  console.log('  ✅ dotenv');
} catch (e) {
  console.log('  ❌ dotenv');
}

console.log('\n✅ Проверка завершена!'); 