const fs = require('fs');
const path = require('path');
const config = require('./config');

// Список всех сотрудников
const allEmployees = [
  'Даша', 'Света', 'Милена', 'Джафар', 'Вика', 'Алина', 
  'Саня', 'Дима', 'Андрей', 'Алёна', 'Кирил', 'Роберт', 
  'Ксения', 'Настя', 'Плутон', 'Стас', 'Влад', 'Артём'
];

// Сотрудники, которые сегодня пришли на работу
const todayWorking = ['Света', 'Даша', 'Милена', 'Джафар', 'Саня', 'Дима', 'Кирил', 'Ксения', 'Настя'];

// Сотрудники, у которых завтра выходной
const tomorrowDayOff = ['Милена', 'Джафар', 'Дима', 'Андрей', 'Роберт'];

// Загрузка текущих данных
function loadData() {
  const dataFile = config.DATA_SETTINGS.dataFile;
  if (fs.existsSync(dataFile)) {
    const raw = fs.readFileSync(dataFile);
    return JSON.parse(raw);
  }
  return {
    parkFrunze: { employees: [], shifts: {}, machines: [] },
    parkMorVokzal: { employees: [], shifts: {}, machines: [] },
    parkNeptun: { employees: [], shifts: {}, machines: [] }
  };
}

// Сохранение данных
function saveData(data) {
  const dataFile = config.DATA_SETTINGS.dataFile;
  const dataDir = path.dirname(dataFile);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log('✅ Данные сохранены успешно');
}

// Добавление сотрудников
function addEmployees() {
  console.log('👥 Добавление сотрудников в систему...');
  
  const data = loadData();
  
  // Добавляем всех сотрудников в парк Фрунзе (основной парк)
  data.parkFrunze.employees = allEmployees;
  
  // Настраиваем смены на сегодня (понедельник - индекс 0)
  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0 = понедельник
  
  console.log(`📅 Настройка смен на сегодня (день недели: ${dayOfWeek})`);
  
  // Инициализируем смены для всех сотрудников
  allEmployees.forEach(employee => {
    if (!data.parkFrunze.shifts[employee]) {
      data.parkFrunze.shifts[employee] = Array(7).fill('');
    }
    
    // Если сотрудник сегодня работает - ставим стандартную смену
    if (todayWorking.includes(employee)) {
      data.parkFrunze.shifts[employee][dayOfWeek] = 'ст';
      console.log(`✅ ${employee} - сегодня работает (стандартная смена)`);
    } else {
      data.parkFrunze.shifts[employee][dayOfWeek] = 'вых';
      console.log(`❌ ${employee} - сегодня выходной`);
    }
  });
  
  // Настраиваем смены на завтра
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayOfWeek = tomorrow.getDay() === 0 ? 6 : tomorrow.getDay() - 1;
  
  console.log(`📅 Настройка смен на завтра (день недели: ${tomorrowDayOfWeek})`);
  
  allEmployees.forEach(employee => {
    // Если сотрудник завтра на выходном - ставим выходной
    if (tomorrowDayOff.includes(employee)) {
      data.parkFrunze.shifts[employee][tomorrowDayOfWeek] = 'вых';
      console.log(`❌ ${employee} - завтра выходной`);
    } else {
      // Для остальных ставим стандартную смену
      data.parkFrunze.shifts[employee][tomorrowDayOfWeek] = 'ст';
      console.log(`✅ ${employee} - завтра работает (стандартная смена)`);
    }
  });
  
  // Сохраняем данные
  saveData(data);
  
  console.log('\n📊 Итоговая статистика:');
  console.log(`👥 Всего сотрудников: ${allEmployees.length}`);
  console.log(`✅ Сегодня работают: ${todayWorking.length}`);
  console.log(`❌ Сегодня выходные: ${allEmployees.length - todayWorking.length}`);
  console.log(`❌ Завтра выходные: ${tomorrowDayOff.length}`);
  console.log(`✅ Завтра работают: ${allEmployees.length - tomorrowDayOff.length}`);
  
  console.log('\n📋 Список всех сотрудников:');
  allEmployees.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp}`);
  });
  
  console.log('\n✅ Сотрудники успешно добавлены в систему!');
  console.log('🎯 Теперь можете запустить бота и проверить функциональность');
}

// Запуск скрипта
addEmployees(); 