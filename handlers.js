const moment = require('moment');
const config = require('./config');

// Меню сотрудников
function showEmployeesMenu(chatId, state, bot) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const parkName = config.PARKS[park]?.name || park;
  
  console.log(`🔍 showEmployeesMenu: park=${park}, employees=${employees.length}`);
  console.log(`📊 parksData keys:`, Object.keys(parksData));
  console.log(`📊 parksData[${park}]:`, parksData[park]);
  
  let message = `👥 Сотрудники парка ${parkName}:\n\n`;
  if (employees.length === 0) {
    message += 'Список сотрудников пуст';
  } else {
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Добавить сотрудника'],
        ['🗑️ Удалить сотрудника'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'employees';
}

// Меню смен
function showShiftsMenu(chatId, state, bot) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  const parkName = config.PARKS[park]?.name || park;
  
  console.log(`🔍 showShiftsMenu: park=${park}, employees=${employees.length}`);
  console.log(`📊 shifts data:`, shifts);
  
  let message = `📅 Таблица смен парка ${parkName}:\n\n`;
  
  if (employees.length === 0) {
    message += 'Нет сотрудников для отображения смен';
  } else {
    message += 'Сотрудник | ' + config.SHIFTS.workDays.join(' | ') + ' | Зарплата\n';
    message += '─'.repeat(50) + '\n';
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      message += `${name} | ${row.join(' | ')} | ${salary}₽\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['✏️ Редактировать смены'],
        ['📅 Смена на завтра'],
        ['💰 Расчёт зарплаты'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'shifts';
}

// Меню хоккея
function showHockeyMenu(chatId, state, bot) {
  const park = state.park;
  const hockeyHistory = parksData[park]?.hockeyHistory || [];
  const nextCollection = parksData[park]?.nextHockeyCollection || moment().add(config.MACHINES.hockeyCollectionInterval, 'days').format('YYYY-MM-DD');
  const parkName = config.PARKS[park]?.name || park;
  
  console.log(`🔍 showHockeyMenu: park=${park}, history=${hockeyHistory.length}`);
  console.log(`📊 hockeyHistory:`, hockeyHistory);
  
  let message = `🏒 Хоккей парка ${parkName}:\n\n`;
  message += `📅 Следующий сбор: ${moment(nextCollection).format('DD.MM.YYYY')}\n`;
  message += `⏰ Интервал: ${config.MACHINES.hockeyCollectionInterval} дней\n\n`;
  
  if (hockeyHistory.length === 0) {
    message += 'История сборов пуста';
  } else {
    message += '📊 История сборов:\n';
    hockeyHistory.slice(-5).forEach((entry, index) => {
      message += `${index + 1}. ${moment(entry.date).format('DD.MM.YYYY')} - ${entry.amount}₽\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Добавить сбор'],
        ['📅 Изменить дату сбора'],
        ['📊 История'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'hockey';
}

// Меню боксёра
function showBoxerMenu(chatId, state, bot) {
  const park = state.park;
  const boxerHistory = parksData[park]?.boxerHistory || [];
  const nextCollection = parksData[park]?.nextBoxerCollection || moment().add(config.MACHINES.boxerCollectionInterval, 'days').format('YYYY-MM-DD');
  const parkName = config.PARKS[park]?.name || park;
  
  let message = `🥊 Боксёр парка ${parkName}:\n\n`;
  message += `📅 Следующий сбор: ${moment(nextCollection).format('DD.MM.YYYY')}\n`;
  message += `⏰ Интервал: ${config.MACHINES.boxerCollectionInterval} дней\n\n`;
  
  if (boxerHistory.length === 0) {
    message += 'История сборов пуста';
  } else {
    message += '📊 История сборов:\n';
    boxerHistory.slice(-5).forEach((entry, index) => {
      message += `${index + 1}. ${moment(entry.date).format('DD.MM.YYYY')} - ${entry.amount}₽\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Добавить сбор'],
        ['📅 Изменить дату сбора'],
        ['📊 История'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'boxer';
}

// Обработка состояний сотрудников
function handleEmployeesStates(chatId, text, state, bot) {
  if (text === '➕ Добавить сотрудника') {
    if (!checkPermission(state.role, 'manage_employees')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для добавления сотрудников.');
      return;
    }
    state.subState = 'adding_employee';
    bot.sendMessage(chatId, 'Введите имя сотрудника:');
  } else if (text === '🗑️ Удалить сотрудника') {
    if (!checkPermission(state.role, 'manage_employees')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для удаления сотрудников.');
      return;
    }
    const employees = parksData[state.park]?.employees || [];
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'Нет сотрудников для удаления');
      return;
    }
    
    let message = 'Выберите сотрудника для удаления:\n\n';
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
    
    state.subState = 'deleting_employee';
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'adding_employee') {
    const park = state.park;
    if (!parksData[park].employees.includes(text)) {
      parksData[park].employees.push(text);
      parksData[park].shifts[text] = Array(7).fill('');
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник "${text}" добавлен!`);
    } else {
      bot.sendMessage(chatId, '❌ Сотрудник с таким именем уже существует!');
    }
    delete state.subState;
    showEmployeesMenu(chatId, state, bot);
  } else if (state.subState === 'deleting_employee') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employeeName = employees[index];
      parksData[park].employees.splice(index, 1);
      delete parksData[park].shifts[employeeName];
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник "${employeeName}" удалён!`);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
    }
    delete state.subState;
    showEmployeesMenu(chatId, state, bot);
  }
}

// Обработка состояний смен
function handleShiftsStates(chatId, text, state, bot) {
  if (text === '✏️ Редактировать смены') {
    if (!checkPermission(state.role, 'manage_shifts')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для редактирования смен.');
      return;
    }
    const employees = parksData[state.park]?.employees || [];
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'Нет сотрудников для редактирования смен');
      return;
    }
    
    let message = 'Выберите сотрудника для редактирования смен:\n\n';
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
    
    state.subState = 'selecting_employee_for_shifts';
    bot.sendMessage(chatId, message);
  } else if (text === '📅 Смена на завтра') {
    if (!checkPermission(state.role, 'manage_shifts')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для управления сменами.');
      return;
    }
    showTomorrowShiftMenu(chatId, state, bot);
  } else if (text === '💰 Расчёт зарплаты') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const shifts = parksData[park]?.shifts || {};
    
    let message = '💰 Расчёт зарплаты:\n\n';
    let totalSalary = 0;
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      totalSalary += salary;
      message += `${name}: ${salary}₽\n`;
    });
    
    message += `\n💵 Общая зарплата: ${totalSalary}₽`;
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'selecting_employee_for_shifts') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employeeName = employees[index];
      state.selectedEmployee = employeeName;
      state.subState = 'editing_shifts';
      
      const shifts = parksData[park]?.shifts?.[employeeName] || Array(7).fill('');
      
      let message = `Редактирование смен для ${employeeName}:\n\n`;
      config.SHIFTS.workDays.forEach((day, i) => {
        message += `${day}: ${shifts[i] || ''}\n`;
      });
      message += '\nВведите новые значения через запятую (7 значений):';
      
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
      delete state.subState;
      showShiftsMenu(chatId, state, bot);
    }
  } else if (state.subState === 'editing_shifts') {
    const park = state.park;
    const values = text.split(',').map(v => v.trim());
    
    if (values.length === 7) {
      const employeeName = state.selectedEmployee;
      parksData[park].shifts[employeeName] = values;
      saveData();
      
      bot.sendMessage(chatId, `✅ Смены для ${employeeName} обновлены!`);
      delete state.subState;
      delete state.selectedEmployee;
      showShiftsMenu(chatId, state, bot);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Введите 7 значений через запятую.');
    }
  }
}

// Меню смены на завтра
function showTomorrowShiftMenu(chatId, state, bot) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const tomorrow = moment().add(1, 'day');
  const dayOfWeek = tomorrow.day() === 0 ? 6 : tomorrow.day() - 1; // Пн=0, Вс=6
  
  let message = `📅 Смена на завтра (${tomorrow.format('DD.MM.YYYY')}):\n\n`;
  
  if (employees.length === 0) {
    message += 'Нет сотрудников для отображения';
  } else {
    employees.forEach(name => {
      const shifts = parksData[park]?.shifts?.[name] || Array(7).fill('');
      const tomorrowShift = shifts[dayOfWeek] || '';
      const status = tomorrowShift ? `✅ ${tomorrowShift}` : '❌ Выходной';
      message += `${name}: ${status}\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['✏️ Изменить смену на завтра'],
        ['📋 Кто выходит завтра'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'tomorrow_shift';
}

// Обработка состояний хоккея
function handleHockeyStates(chatId, text, state, bot) {
  if (text === '➕ Добавить сбор') {
    if (!checkPermission(state.role, 'manage_machines')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для добавления сборов.');
      return;
    }
    state.subState = 'adding_hockey_collection';
    bot.sendMessage(chatId, 
      'Введите данные сбора в формате:\n' +
      'дата,сумма\n\n' +
      'Пример: 2024-01-15,5000\n' +
      'Или просто сумму для сегодняшней даты: 5000'
    );
  } else if (text === '📅 Изменить дату сбора') {
    if (!checkPermission(state.role, 'manage_machines')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для изменения дат сборов.');
      return;
    }
    state.subState = 'changing_hockey_date';
    bot.sendMessage(chatId, 'Введите новую дату сбора (YYYY-MM-DD):');
  } else if (text === '📊 История') {
    const park = state.park;
    const hockeyHistory = parksData[park]?.hockeyHistory || [];
    
    if (hockeyHistory.length === 0) {
      bot.sendMessage(chatId, 'История сборов хоккея пуста');
      return;
    }
    
    let message = '📊 История сборов хоккея:\n\n';
    hockeyHistory.forEach((entry, index) => {
      message += `${index + 1}. ${moment(entry.date).format('DD.MM.YYYY')} - ${entry.amount}₽\n`;
    });
    
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'adding_hockey_collection') {
    const parts = text.split(',');
    let date, amount;
    
    if (parts.length === 2) {
      [date, amount] = parts;
    } else if (parts.length === 1) {
      date = moment().format('YYYY-MM-DD');
      amount = parts[0];
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Используйте: дата,сумма или просто сумму');
      return;
    }
    
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      bot.sendMessage(chatId, '❌ Неверный формат даты! Используйте YYYY-MM-DD');
      return;
    }
    
    const park = state.park;
    const collectionData = {
      date: date,
      amount: parseInt(amount),
      collectedBy: state.userName,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    
    parksData[park].hockeyHistory.push(collectionData);
    parksData[park].nextHockeyCollection = moment(date).add(config.MACHINES.hockeyCollectionInterval, 'days').format('YYYY-MM-DD');
    saveData();
    
    bot.sendMessage(chatId, `✅ Сбор хоккея добавлен: ${moment(date).format('DD.MM.YYYY')} - ${amount}₽`);
    delete state.subState;
    showHockeyMenu(chatId, state, bot);
  } else if (state.subState === 'changing_hockey_date') {
    if (!moment(text, 'YYYY-MM-DD', true).isValid()) {
      bot.sendMessage(chatId, '❌ Неверный формат даты! Используйте YYYY-MM-DD');
      return;
    }
    
    const park = state.park;
    parksData[park].nextHockeyCollection = text;
    saveData();
    
    bot.sendMessage(chatId, `✅ Дата следующего сбора хоккея изменена на: ${moment(text).format('DD.MM.YYYY')}`);
    delete state.subState;
    showHockeyMenu(chatId, state, bot);
  }
}

// Обработка состояний боксёра
function handleBoxerStates(chatId, text, state, bot) {
  if (text === '➕ Добавить сбор') {
    if (!checkPermission(state.role, 'manage_machines')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для добавления сборов.');
      return;
    }
    state.subState = 'adding_boxer_collection';
    bot.sendMessage(chatId, 
      'Введите данные сбора в формате:\n' +
      'дата,сумма\n\n' +
      'Пример: 2024-01-15,2500\n' +
      'Или просто сумму для сегодняшней даты: 2500'
    );
  } else if (text === '📅 Изменить дату сбора') {
    if (!checkPermission(state.role, 'manage_machines')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для изменения дат сборов.');
      return;
    }
    state.subState = 'changing_boxer_date';
    bot.sendMessage(chatId, 'Введите новую дату сбора (YYYY-MM-DD):');
  } else if (text === '📊 История') {
    const park = state.park;
    const boxerHistory = parksData[park]?.boxerHistory || [];
    
    if (boxerHistory.length === 0) {
      bot.sendMessage(chatId, 'История сборов боксёра пуста');
      return;
    }
    
    let message = '📊 История сборов боксёра:\n\n';
    boxerHistory.forEach((entry, index) => {
      message += `${index + 1}. ${moment(entry.date).format('DD.MM.YYYY')} - ${entry.amount}₽\n`;
    });
    
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'adding_boxer_collection') {
    const parts = text.split(',');
    let date, amount;
    
    if (parts.length === 2) {
      [date, amount] = parts;
    } else if (parts.length === 1) {
      date = moment().format('YYYY-MM-DD');
      amount = parts[0];
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Используйте: дата,сумма или просто сумму');
      return;
    }
    
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      bot.sendMessage(chatId, '❌ Неверный формат даты! Используйте YYYY-MM-DD');
      return;
    }
    
    const park = state.park;
    const collectionData = {
      date: date,
      amount: parseInt(amount),
      collectedBy: state.userName,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    
    parksData[park].boxerHistory.push(collectionData);
    parksData[park].nextBoxerCollection = moment(date).add(config.MACHINES.boxerCollectionInterval, 'days').format('YYYY-MM-DD');
    saveData();
    
    bot.sendMessage(chatId, `✅ Сбор боксёра добавлен: ${moment(date).format('DD.MM.YYYY')} - ${amount}₽`);
    delete state.subState;
    showBoxerMenu(chatId, state, bot);
  } else if (state.subState === 'changing_boxer_date') {
    if (!moment(text, 'YYYY-MM-DD', true).isValid()) {
      bot.sendMessage(chatId, '❌ Неверный формат даты! Используйте YYYY-MM-DD');
      return;
    }
    
    const park = state.park;
    parksData[park].nextBoxerCollection = text;
    saveData();
    
    bot.sendMessage(chatId, `✅ Дата следующего сбора боксёра изменена на: ${moment(text).format('DD.MM.YYYY')}`);
    delete state.subState;
    showBoxerMenu(chatId, state, bot);
  }
}

// Функция расчёта зарплаты
function calculateSalary(name, row) {
  const total = row.reduce((sum, val) => {
    const shiftType = config.SHIFTS.shiftTypes[val];
    return sum + (shiftType ? shiftType.salary : 0);
  }, 0);
  return total;
}

// Проверка роли пользователя
function checkPermission(userRole, action) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_machines'],
    manager: ['read', 'write', 'manage_employees', 'manage_shifts'],
    supervisor: ['read', 'write'],
    viewer: ['read']
  };
  
  return permissions[userRole]?.includes(action) || false;
}

// Сохранение данных (будет передаваться из основного файла)
let saveDataFunction = null;

function setSaveDataFunction(func) {
  saveDataFunction = func;
}

function saveData() {
  if (saveDataFunction) {
    saveDataFunction();
  }
}

// Глобальная переменная для данных парков
let parksData = {};

// Функция для установки данных парков
function setParksData(data) {
  parksData = data;
}

module.exports = {
  showEmployeesMenu,
  showShiftsMenu,
  showHockeyMenu,
  showBoxerMenu,
  handleEmployeesStates,
  handleShiftsStates,
  handleHockeyStates,
  handleBoxerStates,
  showTomorrowShiftMenu,
  calculateSalary,
  checkPermission,
  setParksData,
  setSaveDataFunction
}; 