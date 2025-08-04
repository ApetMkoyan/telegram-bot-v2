const fs = require('fs');
const path = require('path');
const config = require('./config');

// Загрузка данных
function loadData() {
  const dataFile = config.DATA_SETTINGS.dataFile;
  if (fs.existsSync(dataFile)) {
    const raw = fs.readFileSync(dataFile);
    return JSON.parse(raw);
  }
  return null;
}

// Тестирование функциональности
function testEmployees() {
  console.log('🧪 Тестирование функциональности сотрудников...\n');
  
  const data = loadData();
  if (!data) {
    console.log('❌ Данные не найдены!');
    return;
  }
  
  const park = 'parkFrunze';
  const employees = data[park]?.employees || [];
  const shifts = data[park]?.shifts || {};
  
  console.log(`📊 Статистика парка ${config.PARKS[park]?.name || park}:`);
  console.log(`👥 Всего сотрудников: ${employees.length}`);
  
  if (employees.length > 0) {
    console.log('\n📋 Список сотрудников:');
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp}`);
    });
    
    console.log('\n📅 Смены на сегодня:');
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    let workingToday = [];
    let dayOffToday = [];
    
    employees.forEach(name => {
      const employeeShifts = shifts[name] || Array(7).fill('');
      const todayShift = employeeShifts[dayOfWeek] || '';
      
      if (todayShift && todayShift !== 'вых') {
        workingToday.push(name);
      } else {
        dayOffToday.push(name);
      }
    });
    
    console.log(`✅ Сегодня работают (${workingToday.length}):`);
    workingToday.forEach(name => console.log(`  • ${name}`));
    
    console.log(`❌ Сегодня выходные (${dayOffToday.length}):`);
    dayOffToday.forEach(name => console.log(`  • ${name}`));
    
    console.log('\n📅 Смены на завтра:');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay() === 0 ? 6 : tomorrow.getDay() - 1;
    
    let workingTomorrow = [];
    let dayOffTomorrow = [];
    
    employees.forEach(name => {
      const employeeShifts = shifts[name] || Array(7).fill('');
      const tomorrowShift = employeeShifts[tomorrowDayOfWeek] || '';
      
      if (tomorrowShift && tomorrowShift !== 'вых') {
        workingTomorrow.push(name);
      } else {
        dayOffTomorrow.push(name);
      }
    });
    
    console.log(`✅ Завтра работают (${workingTomorrow.length}):`);
    workingTomorrow.forEach(name => console.log(`  • ${name}`));
    
    console.log(`❌ Завтра выходные (${dayOffTomorrow.length}):`);
    dayOffTomorrow.forEach(name => console.log(`  • ${name}`));
    
    // Расчёт зарплат
    console.log('\n💰 Расчёт зарплат:');
    let totalSalary = 0;
    employees.forEach(name => {
      const employeeShifts = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, employeeShifts);
      totalSalary += salary;
      console.log(`  ${name}: ${salary}₽`);
    });
    console.log(`💵 Общая зарплата: ${totalSalary}₽`);
    
  } else {
    console.log('❌ Список сотрудников пуст!');
  }
  
  console.log('\n✅ Тестирование завершено!');
}

// Функция расчёта зарплаты (копия из handlers.js)
function calculateSalary(name, row) {
  let salary = 0;
  row.forEach(shift => {
    if (shift && shift !== 'вых') {
      const shiftInfo = config.SHIFTS.shiftTypes[shift];
      if (shiftInfo) {
        salary += shiftInfo.salary;
      }
    }
  });
  return salary;
}

// Запуск теста
testEmployees(); 