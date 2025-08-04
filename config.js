require('dotenv').config();

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  
  // Улучшенная система пользователей
  USERS: {
    // Администраторы (полный доступ)
    adminApet: { 
      password: '1234', 
      park: 'parkFrunze', 
      role: 'admin',
      name: 'Админ Апет'
    },
    adminNarek: { 
      password: '4321', 
      park: 'parkMorVokzal', 
      role: 'admin',
      name: 'Админ Нарек'
    },
    adminXunk: { 
      password: '9999', 
      park: 'parkNeptun', 
      role: 'admin',
      name: 'Админ Хунк'
    },
    
    // Менеджеры (управление сотрудниками и сменами)
    manager1: { 
      password: '5678', 
      park: 'parkFrunze', 
      role: 'manager',
      name: 'Менеджер 1'
    },
    manager2: { 
      password: '8765', 
      park: 'parkFrunze', 
      role: 'manager',
      name: 'Менеджер 2'
    },
    managerMorVokzal: { 
      password: '3333', 
      park: 'parkMorVokzal', 
      role: 'manager',
      name: 'Менеджер МорВокзал'
    },
    managerNeptun: { 
      password: '4444', 
      park: 'parkNeptun', 
      role: 'manager',
      name: 'Менеджер Нептун'
    },
    
    // Супервайзеры (просмотр и редактирование)
    supervisor1: { 
      password: '1111', 
      park: 'parkFrunze', 
      role: 'supervisor',
      name: 'Супервайзер 1'
    },
    supervisor2: { 
      password: '2222', 
      park: 'parkFrunze', 
      role: 'supervisor',
      name: 'Супервайзер 2'
    },
    
    // Простые пользователи (только просмотр смен)
    viewer1: { 
      password: 'view1', 
      park: 'parkFrunze', 
      role: 'viewer',
      name: 'Просмотрщик 1'
    },
    viewer2: { 
      password: 'view2', 
      park: 'parkFrunze', 
      role: 'viewer',
      name: 'Просмотрщик 2'
    }
  },
  
  // Настройки парков
  PARKS: {
    parkFrunze: { 
      name: 'Парк Фрунзе', 
      hockeyMachines: 5, 
      boxerMachines: 1,
      collectionPoints: ['Точка 1', 'Точка 2']
    },
    parkMorVokzal: { 
      name: 'Парк Морской Вокзал', 
      hockeyMachines: 1, 
      boxerMachines: 1,
      collectionPoints: ['Точка 1']
    },
    parkNeptun: { 
      name: 'Парк Нептун', 
      hockeyMachines: 1, 
      boxerMachines: 1,
      collectionPoints: ['Точка 1']
    }
  },
  
  // Настройки безопасности
  SECURITY: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60,
    allowedUsers: parseInt(process.env.ALLOWED_USERS) || 20
  },
  
  // Настройки данных
  DATA_SETTINGS: {
    dataFile: process.env.DATA_FILE || './data/bot-data.json',
    backupInterval: parseInt(process.env.BACKUP_INTERVAL) || 24 * 60 * 60 * 1000
  },
  
  // Настройки бота
  BOT_SETTINGS: {
    polling: true,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  },
  
  // Настройки хоккея и боксёра
  MACHINES: {
    hockeyCollectionInterval: parseInt(process.env.HOCKEY_COLLECTION_INTERVAL) || 14, // дней
    boxerCollectionInterval: parseInt(process.env.BOXER_COLLECTION_INTERVAL) || 7, // дней
    hockeyPrice: 100, // цена за игру
    boxerPrice: 50   // цена за игру
  },
  
  // Настройки смен
  SHIFTS: {
    workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    shiftTypes: {
      '++': { name: 'Двойная смена', salary: 2000 },
      'ст': { name: 'Стандартная смена', salary: 1000 },
      'касса1': { name: 'Касса 1', salary: 2500 },
      'касса2': { name: 'Касса 2', salary: 3000 },
      '+': { name: 'Дополнительная смена', salary: 1500 },
      '1200': { name: 'Смена 1200', salary: 1200 },
      '1000': { name: 'Смена 1000', salary: 1000 },
      'вых': { name: 'Выходной', salary: 0 },
      '': { name: 'Не указано', salary: 0 }
    }
  }
};

module.exports = config; 