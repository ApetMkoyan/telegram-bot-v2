const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const config = require('./config');

// Проверка наличия токена бота
if (!config.BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не найден в переменных окружения!');
  console.error('Пожалуйста, установите переменную BOT_TOKEN в файле .env');
  process.exit(1);
}

// Создание папки для данных
const dataDir = path.dirname(config.DATA_SETTINGS.dataFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const bot = new TelegramBot(config.BOT_TOKEN, config.BOT_SETTINGS);

// Структура данных
let parksData = {};
const userStates = {};
const loginAttempts = {};
const activeSessions = {};

// Загрузка данных
function loadData() {
  try {
    console.log('📂 Попытка загрузки данных из:', config.DATA_SETTINGS.dataFile);
    console.log('📁 Папка данных:', dataDir);
    
    if (fs.existsSync(config.DATA_SETTINGS.dataFile)) {
      const raw = fs.readFileSync(config.DATA_SETTINGS.dataFile);
      parksData = JSON.parse(raw);
      console.log('✅ Данные загружены успешно');
      console.log('📊 Загружено парков:', Object.keys(parksData).length);
      Object.keys(parksData).forEach(park => {
        console.log(`  - ${park}: ${parksData[park].employees?.length || 0} сотрудников`);
      });
    } else {
      console.log('📝 Файл данных не найден, создаю новую структуру...');
      parksData = {
        parkFrunze: { 
          employees: [], 
          shifts: {}, 
          machines: [],
          hockeyHistory: [],
          boxerHistory: [],
          nextHockeyCollection: moment().add(config.MACHINES.hockeyCollectionInterval, 'days').format('YYYY-MM-DD'),
          nextBoxerCollection: moment().add(config.MACHINES.boxerCollectionInterval, 'days').format('YYYY-MM-DD')
        },
        parkMorVokzal: { 
          employees: [], 
          shifts: {}, 
          machines: [],
          hockeyHistory: [],
          boxerHistory: [],
          nextHockeyCollection: moment().add(config.MACHINES.hockeyCollectionInterval, 'days').format('YYYY-MM-DD'),
          nextBoxerCollection: moment().add(config.MACHINES.boxerCollectionInterval, 'days').format('YYYY-MM-DD')
        },
        parkNeptun: { 
          employees: [], 
          shifts: {}, 
          machines: [],
          hockeyHistory: [],
          boxerHistory: [],
          nextHockeyCollection: moment().add(config.MACHINES.hockeyCollectionInterval, 'days').format('YYYY-MM-DD'),
          nextBoxerCollection: moment().add(config.MACHINES.boxerCollectionInterval, 'days').format('YYYY-MM-DD')
        }
      };
      saveData();
      console.log('✅ Создан новый файл данных');
    }
  } catch (error) {
    console.log('❌ Ошибка загрузки данных:', error);
    console.log('🔄 Создаю резервную структуру данных...');
    parksData = {
      parkFrunze: { employees: [], shifts: {}, machines: [] },
      parkMorVokzal: { employees: [], shifts: {}, machines: [] },
      parkNeptun: { employees: [], shifts: {}, machines: [] }
    };
  }
}

// Сохранение данных
function saveData() {
  try {
    console.log('💾 Сохранение данных в:', config.DATA_SETTINGS.dataFile);
    fs.writeFileSync(config.DATA_SETTINGS.dataFile, JSON.stringify(parksData, null, 2));
    console.log('✅ Данные сохранены успешно');
  } catch (error) {
    console.log('❌ Ошибка сохранения данных:', error);
    console.log('📁 Проверка прав доступа к папке:', dataDir);
    try {
      fs.accessSync(dataDir, fs.constants.W_OK);
      console.log('✅ Права на запись есть');
    } catch (accessError) {
      console.log('❌ Нет прав на запись:', accessError.message);
    }
  }
}

// Автоматическое резервное копирование
function createBackup() {
  try {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupFile = path.join(dataDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(parksData, null, 2));
    console.log(`💾 Резервная копия создана: ${backupFile}`);
  } catch (error) {
    console.log('❌ Ошибка создания резервной копии:', error);
  }
}

// Проверка безопасности
function checkSecurity(chatId) {
  const now = Date.now();
  
  // Очистка старых сессий
  Object.keys(activeSessions).forEach(sessionId => {
    if (now - activeSessions[sessionId].timestamp > config.SECURITY.sessionTimeout * 1000) {
      delete activeSessions[sessionId];
      delete userStates[sessionId];
      console.log(`⏰ Сессия ${sessionId} истекла`);
    }
  });
  
  const activeUsers = Object.keys(activeSessions).length;
  if (activeUsers >= config.SECURITY.allowedUsers) {
    return { allowed: false, reason: 'Достигнут лимит активных пользователей' };
  }
  
  return { allowed: true };
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

// Клавиатуры
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['👥 Сотрудники', '📅 Смены'],
      ['🏒 Хоккей', '🥊 Боксёр'],
      ['📊 Отчёты', '⚙️ Настройки'],
      ['🚪 Выйти']
    ],
    resize_keyboard: true
  }
};

const backKeyboard = {
  reply_markup: {
    keyboard: [['🔙 Назад']],
    resize_keyboard: true
  }
};

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const securityCheck = checkSecurity(chatId);
  
  if (!securityCheck.allowed) {
    bot.sendMessage(chatId, `❌ ${securityCheck.reason}. Попробуйте позже.`);
    return;
  }
  
  userStates[chatId] = { state: 'login', step: 'username' };
  loginAttempts[chatId] = 0;
  
  bot.sendMessage(chatId, 
    '🎢 Добро пожаловать в систему управления парком аттракционов!\n\n' +
    'Для входа введите логин:',
    backKeyboard
  );
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  console.log(`📨 Получено сообщение от ${chatId}: ${text}`);
  
  const securityCheck = checkSecurity(chatId);
  if (!securityCheck.allowed) {
    bot.sendMessage(chatId, `❌ ${securityCheck.reason}. Попробуйте позже.`);
    return;
  }
  
  // Проверяем, есть ли состояние пользователя
  if (!userStates[chatId]) {
    console.log(`🆕 Новый пользователь ${chatId}, создаю состояние`);
    userStates[chatId] = { state: 'login', step: 'username' };
    loginAttempts[chatId] = 0;
  }
  
  const state = userStates[chatId];
  console.log(`👤 Состояние пользователя ${chatId}:`, state);
  
  // Обработка выхода
  if (text === '🚪 Выйти') {
    console.log(`🚪 Пользователь ${chatId} выходит из системы`);
    delete userStates[chatId];
    delete activeSessions[chatId];
    delete loginAttempts[chatId];
    bot.sendMessage(chatId, 'Вы вышли из системы. Введите /start для повторного входа.');
    return;
  }
  
  // Обработка возврата
  if (text === '🔙 Назад') {
    console.log(`🔙 Пользователь ${chatId} возвращается назад`);
    if (state.state === 'logged_in') {
      showMainMenu(chatId);
    } else {
      userStates[chatId] = { state: 'login', step: 'username' };
      bot.sendMessage(chatId, 'Введите логин:', backKeyboard);
    }
    return;
  }
  
  // Обработка авторизации
  if (state.state === 'login') {
    console.log(`🔐 Обработка авторизации для ${chatId}`);
    handleLogin(chatId, text, state);
    return;
  }
  
  // Обработка главного меню
  if (state.state === 'logged_in') {
    console.log(`📋 Обработка главного меню для ${chatId}: ${text}`);
    handleMainMenu(chatId, text, state);
    return;
  }
  
  // Обработка состояний
  console.log(`🔄 Обработка состояний для ${chatId}: ${state.currentSection}`);
  handleStates(chatId, text, state);
});

// Обработка авторизации
function handleLogin(chatId, text, state) {
  if (state.step === 'username') {
    if (config.USERS[text]) {
      state.username = text;
      state.step = 'password';
      bot.sendMessage(chatId, 'Введите пароль:');
    } else {
      loginAttempts[chatId] = (loginAttempts[chatId] || 0) + 1;
      if (loginAttempts[chatId] >= config.SECURITY.maxLoginAttempts) {
        bot.sendMessage(chatId, '❌ Слишком много попыток входа. Попробуйте позже.');
        delete userStates[chatId];
        return;
      }
      bot.sendMessage(chatId, `❌ Неверный логин. Попыток осталось: ${config.SECURITY.maxLoginAttempts - loginAttempts[chatId]}`);
    }
  } else if (state.step === 'password') {
    if (config.USERS[state.username] && config.USERS[state.username].password === text) {
      state.state = 'logged_in';
      state.park = config.USERS[state.username].park;
      state.role = config.USERS[state.username].role;
      state.userName = config.USERS[state.username].name;
      delete state.step;
      delete state.username;
      delete loginAttempts[chatId];
      
      activeSessions[chatId] = {
        user: state.userName,
        park: state.park,
        role: state.role,
        timestamp: Date.now()
      };
      
      const parkName = config.PARKS[state.park]?.name || state.park;
      bot.sendMessage(chatId, 
        `✅ Успешный вход!\n🏢 Парк: ${parkName}\n👤 Роль: ${state.role}\n👤 Пользователь: ${state.userName}`,
        mainKeyboard
      );
      showMainMenu(chatId);
    } else {
      loginAttempts[chatId] = (loginAttempts[chatId] || 0) + 1;
      if (loginAttempts[chatId] >= config.SECURITY.maxLoginAttempts) {
        bot.sendMessage(chatId, '❌ Слишком много попыток входа. Попробуйте позже.');
        delete userStates[chatId];
        return;
      }
      bot.sendMessage(chatId, `❌ Неверный пароль. Попыток осталось: ${config.SECURITY.maxLoginAttempts - loginAttempts[chatId]}`);
    }
  }
}

// Показать главное меню
function showMainMenu(chatId) {
  const state = userStates[chatId];
  const park = state.park;
  const parkName = config.PARKS[park]?.name || park;
  
  bot.sendMessage(chatId, 
    `🏢 Парк: ${parkName}\n👤 Роль: ${state.role}\n👤 Пользователь: ${state.userName}\n\nВыберите действие:`,
    mainKeyboard
  );
}

// Обработка главного меню
function handleMainMenu(chatId, text, state) {
  switch (text) {
    case '👥 Сотрудники':
      if (checkPermission(state.role, 'read')) {
        showEmployeesMenu(chatId, state, bot);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра сотрудников.');
      }
      break;
    case '📅 Смены':
      if (checkPermission(state.role, 'read')) {
        showShiftsMenu(chatId, state, bot);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра смен.');
      }
      break;
    case '🏒 Хоккей':
      if (checkPermission(state.role, 'read')) {
        showHockeyMenu(chatId, state, bot);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра хоккея.');
      }
      break;
    case '🥊 Боксёр':
      if (checkPermission(state.role, 'read')) {
        showBoxerMenu(chatId, state, bot);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра боксёра.');
      }
      break;
    case '📊 Отчёты':
      if (checkPermission(state.role, 'read')) {
        showReports(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра отчётов.');
      }
      break;
    case '⚙️ Настройки':
      showSettings(chatId, state);
      break;
  }
}

// Импорт обработчиков
const handlers = require('./handlers');

// Функции для показа меню (импортированные из handlers)
const showEmployeesMenu = handlers.showEmployeesMenu;
const showShiftsMenu = handlers.showShiftsMenu;
const showHockeyMenu = handlers.showHockeyMenu;
const showBoxerMenu = handlers.showBoxerMenu;

// Отчёты
function showReports(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  const hockeyHistory = parksData[park]?.hockeyHistory || [];
  const boxerHistory = parksData[park]?.boxerHistory || [];
  const parkName = config.PARKS[park]?.name || park;
  
  // Расчёт общей зарплаты
  let totalSalary = 0;
  employees.forEach(name => {
    const row = shifts[name] || Array(7).fill('');
    totalSalary += handlers.calculateSalary(name, row);
  });
  
  // Расчёт доходов с автоматов
  const hockeyIncome = hockeyHistory.reduce((sum, entry) => sum + entry.amount, 0);
  const boxerIncome = boxerHistory.reduce((sum, entry) => sum + entry.amount, 0);
  
  const message = `📊 Отчёт по парку ${parkName}:\n\n` +
    `👥 Сотрудников: ${employees.length}\n` +
    `💰 Общая зарплата: ${totalSalary}₽\n` +
    `🏒 Доход с хоккея: ${hockeyIncome}₽\n` +
    `🥊 Доход с боксёра: ${boxerIncome}₽\n` +
    `📈 Общий доход: ${hockeyIncome + boxerIncome}₽\n` +
    `💵 Прибыль: ${hockeyIncome + boxerIncome - totalSalary}₽`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
}

// Настройки
function showSettings(chatId, state) {
  const park = state.park;
  const parkName = config.PARKS[park]?.name || park;
  
  const message = `⚙️ Настройки\n\n` +
    `🏢 Парк: ${parkName}\n` +
    `👤 Пользователь: ${state.userName}\n` +
    `🔐 Роль: ${state.role}\n` +
    `⏰ Активных сессий: ${Object.keys(activeSessions).length}/${config.SECURITY.allowedUsers}\n` +
    `🔄 Авторезерв: ${config.DATA_SETTINGS.backupInterval / (60 * 60 * 1000)}ч\n` +
    `🔒 Попыток входа: ${config.SECURITY.maxLoginAttempts}\n` +
    `⏱️ Таймаут сессии: ${config.SECURITY.sessionTimeout / 60}мин`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
}

// Обработка состояний
function handleStates(chatId, text, state) {
  if (!state.currentSection) {
    console.log(`❌ Нет текущей секции для ${chatId}`);
    return;
  }
  
  console.log(`🔄 Обработка состояния ${state.currentSection} для ${chatId}`);
  
  // Установка данных парков для обработчиков
  handlers.setParksData(parksData);
  handlers.setSaveDataFunction(saveData);
  
  switch (state.currentSection) {
    case 'employees':
      console.log(`👥 Обработка сотрудников для ${chatId}`);
      handlers.handleEmployeesStates(chatId, text, state, bot);
      break;
    case 'shifts':
      console.log(`📅 Обработка смен для ${chatId}`);
      handlers.handleShiftsStates(chatId, text, state, bot);
      break;
    case 'hockey':
      console.log(`🏒 Обработка хоккея для ${chatId}`);
      handlers.handleHockeyStates(chatId, text, state, bot);
      break;
    case 'boxer':
      console.log(`🥊 Обработка боксёра для ${chatId}`);
      handlers.handleBoxerStates(chatId, text, state, bot);
      break;
    case 'tomorrow_shift':
      console.log(`📅 Обработка смены на завтра для ${chatId}`);
      handleTomorrowShiftStates(chatId, text, state);
      break;
    default:
      console.log(`❌ Неизвестная секция: ${state.currentSection}`);
      bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте еще раз.');
      showMainMenu(chatId);
  }
}

// Обработка состояний смены на завтра
function handleTomorrowShiftStates(chatId, text, state) {
  if (text === '✏️ Изменить смену на завтра') {
    if (!handlers.checkPermission(state.role, 'manage_shifts')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для изменения смен.');
      return;
    }
    const employees = parksData[state.park]?.employees || [];
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'Нет сотрудников для изменения смен');
      return;
    }
    
    let message = 'Выберите сотрудника для изменения смены на завтра:\n\n';
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
    
    state.subState = 'selecting_employee_for_tomorrow';
    bot.sendMessage(chatId, message);
  } else if (text === '📋 Кто выходит завтра') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const tomorrow = moment().add(1, 'day');
    const dayOfWeek = tomorrow.day() === 0 ? 6 : tomorrow.day() - 1;
    
    let workingEmployees = [];
    let dayOffEmployees = [];
    
    employees.forEach(name => {
      const shifts = parksData[park]?.shifts?.[name] || Array(7).fill('');
      const tomorrowShift = shifts[dayOfWeek] || '';
      
      if (tomorrowShift && tomorrowShift !== 'вых') {
        workingEmployees.push(name);
      } else {
        dayOffEmployees.push(name);
      }
    });
    
    let message = `📅 Кто выходит завтра (${tomorrow.format('DD.MM.YYYY')}):\n\n`;
    
    if (workingEmployees.length > 0) {
      message += '✅ Работают:\n';
      workingEmployees.forEach(name => {
        message += `• ${name}\n`;
      });
      message += '\n';
    }
    
    if (dayOffEmployees.length > 0) {
      message += '❌ Выходные:\n';
      dayOffEmployees.forEach(name => {
        message += `• ${name}\n`;
      });
    }
    
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'selecting_employee_for_tomorrow') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employeeName = employees[index];
      state.selectedEmployee = employeeName;
      state.subState = 'editing_tomorrow_shift';
      
      const tomorrow = moment().add(1, 'day');
      const dayOfWeek = tomorrow.day() === 0 ? 6 : tomorrow.day() - 1;
      const shifts = parksData[park]?.shifts?.[employeeName] || Array(7).fill('');
      const currentShift = shifts[dayOfWeek] || '';
      
      let message = `Редактирование смены на завтра для ${employeeName}:\n\n`;
      message += `Текущая смена: ${currentShift || 'Выходной'}\n\n`;
      message += 'Доступные типы смен:\n';
      Object.keys(config.SHIFTS.shiftTypes).forEach(type => {
        const shiftInfo = config.SHIFTS.shiftTypes[type];
        message += `• ${type} - ${shiftInfo.name} (${shiftInfo.salary}₽)\n`;
      });
      message += '\nВведите новый тип смены:';
      
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
      delete state.subState;
      handlers.showTomorrowShiftMenu(chatId, state, bot);
    }
  } else if (state.subState === 'editing_tomorrow_shift') {
    const park = state.park;
    const employeeName = state.selectedEmployee;
    const tomorrow = moment().add(1, 'day');
    const dayOfWeek = tomorrow.day() === 0 ? 6 : tomorrow.day() - 1;
    
    if (text === 'вых' || config.SHIFTS.shiftTypes[text]) {
      if (!parksData[park].shifts[employeeName]) {
        parksData[park].shifts[employeeName] = Array(7).fill('');
      }
      
      parksData[park].shifts[employeeName][dayOfWeek] = text;
      saveData();
      
      const shiftName = text === 'вых' ? 'Выходной' : config.SHIFTS.shiftTypes[text].name;
      bot.sendMessage(chatId, `✅ Смена на завтра для ${employeeName} изменена на: ${shiftName}`);
      
      delete state.subState;
      delete state.selectedEmployee;
      handlers.showTomorrowShiftMenu(chatId, state, bot);
    } else {
      bot.sendMessage(chatId, '❌ Неверный тип смены! Используйте один из доступных типов.');
    }
  }
}

// Мониторинг
function logStatus() {
  const activeUsers = Object.keys(activeSessions).length;
  const totalEmployees = Object.values(parksData).reduce((sum, park) => sum + park.employees.length, 0);
  const totalHockeyCollections = Object.values(parksData).reduce((sum, park) => sum + (park.hockeyHistory?.length || 0), 0);
  const totalBoxerCollections = Object.values(parksData).reduce((sum, park) => sum + (park.boxerHistory?.length || 0), 0);
  
  console.log(`🟢 Статус бота:`);
  console.log(`   👥 Активных пользователей: ${activeUsers}/${config.SECURITY.allowedUsers}`);
  console.log(`   🏢 Всего сотрудников: ${totalEmployees}`);
  console.log(`   🏒 Сборов хоккея: ${totalHockeyCollections}`);
  console.log(`   🥊 Сборов боксёра: ${totalBoxerCollections}`);
  console.log(`   ⏰ Время: ${new Date().toLocaleString()}`);
}

// Инициализация
loadData();

// Настройка автоматических задач
setInterval(createBackup, config.DATA_SETTINGS.backupInterval);
setInterval(logStatus, 5 * 60 * 1000); // Каждые 5 минут

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.log('❌ Polling error:', error.message);
  
  // Обработка ошибки 409 - конфликт с другим экземпляром бота
  if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
    console.log('⚠️ Обнаружен конфликт с другим экземпляром бота');
    console.log('🔄 Остановка текущего polling...');
    
    // Останавливаем текущий polling
    bot.stopPolling();
    
    console.log('⏳ Ожидание 5 секунд перед перезапуском...');
    setTimeout(() => {
      console.log('🔄 Перезапуск polling...');
      bot.startPolling();
    }, 5000);
  }
});

bot.on('error', (error) => {
  console.log('❌ Bot error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  saveData();
  createBackup();
  console.log('✅ Данные сохранены, бот завершает работу');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  saveData();
  createBackup();
  console.log('✅ Данные сохранены, бот завершает работу');
  process.exit(0);
});

console.log('🚀 Улучшенный Telegram бот запущен!');
console.log('🔐 Система ролей и безопасности активна');
console.log('👥 Максимум пользователей:', config.SECURITY.allowedUsers);
console.log('⏰ Таймаут сессии:', config.SECURITY.sessionTimeout / 60, 'минут');
console.log('💾 Авторезерв каждые:', config.DATA_SETTINGS.backupInterval / (60 * 60 * 1000), 'часов');
console.log('🏒 Интервал сбора хоккея:', config.MACHINES.hockeyCollectionInterval, 'дней');
console.log('🥊 Интервал сбора боксёра:', config.MACHINES.boxerCollectionInterval, 'дней');
console.log('📊 Мониторинг каждые 5 минут');

// Запускаем бота только если файл запущен напрямую
if (require.main === module) {
  console.log('🎯 Запуск бота в режиме polling...');
  bot.startPolling();
}

// Экспортируем экземпляр бота для использования в других модулях
module.exports = bot; 