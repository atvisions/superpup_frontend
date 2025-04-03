const { app, BrowserWindow, Tray, Menu, ipcMain, systemPreferences } = require('electron');
const path = require('path');
const axios = require('axios');
const isDev = process.env.NODE_ENV === 'development';
require('dotenv').config();

// 后端API配置
const BACKEND_API = 'http://127.0.0.1:8000';
console.log('[Main] Backend API URL:', BACKEND_API);

// 发送消息到Django后端
async function sendToBackend(message) {
  console.log('[Main] Preparing to send message to backend');
  try {
    const url = `${BACKEND_API}/api/chat/message/`;
    console.log('[Main] Sending request to:', url);
    console.log('[Main] Request payload:', { message });
    
    const response = await axios.post(url, {
      message: message
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      timeout: 90000, // 增加到90秒超时
      withCredentials: false,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // 接受所有非500错误的状态码
      }
    });
    
    console.log('[Main] Backend response status:', response.status);
    console.log('[Main] Backend response headers:', response.headers);
    console.log('[Main] Backend response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Main] Error sending message to backend:', error);
    if (error.response) {
      console.error('[Main] Backend error response:', error.response.data);
      console.error('[Main] Backend error status:', error.response.status);
      console.error('[Main] Backend error headers:', error.response.headers);
      throw error.response.data.error || '服务器错误';
    }
    if (error.request) {
      console.error('[Main] No response received:', error.request);
      throw '无法连接到服务器，请检查网络连接';
    }
    throw error.message || '发送消息失败';
  }
}

// 注册IPC事件监听器
ipcMain.on('minimize-window', (event) => {
  console.log('[Main] Received minimize-window event');
  BrowserWindow.fromWebContents(event.sender).minimize();
});

ipcMain.on('close-window', (event) => {
  console.log('[Main] Received close-window event');
  BrowserWindow.fromWebContents(event.sender).close();
});

// 处理AI对话请求
ipcMain.on('chat-message', async (event, message) => {
  console.log('[Main] Received chat-message:', message);
  try {
    console.log('[Main] Starting to process message...');
    console.log('[Main] Backend API URL:', BACKEND_API);
    console.log('[Main] Full request URL:', `${BACKEND_API}/api/chat/message/`);
    
    const response = await sendToBackend(message);
    console.log('[Main] Backend response received:', response);
    
    if (response && response.message) {
      console.log('[Main] Valid response received, sending to renderer');
      event.sender.send('chat-message-response', { 
        success: true, 
        response: { message: response.message } 
      });
      console.log('[Main] Success response sent to renderer');
    } else {
      console.error('[Main] Invalid response format:', response);
      event.sender.send('chat-error', '后端返回的数据格式不正确');
    }
  } catch (error) {
    console.error('[Main] Error in chat-message handler:', error);
    console.error('[Main] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    const errorMessage = error.response?.data?.error || error.message || '发送消息失败，请检查后端服务是否正常运行';
    event.sender.send('chat-error', errorMessage);
  }
});

let mainWindow;
let petWindow;
let tray;

function createMainWindow() {
  const iconPath = path.join(__dirname, 'icon.png');
  console.log('[Main] Icon path:', iconPath);

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'pet.webp'),
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff'
  });

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  // 开发环境打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 处理主题变化
  const isDark = systemPreferences.isDarkMode();
  mainWindow.webContents.send('theme-changed', isDark ? 'dark' : 'light');
  
  systemPreferences.on('accent-color-changed', () => {
    const isDark = systemPreferences.isDarkMode();
    mainWindow.webContents.send('theme-changed', isDark ? 'dark' : 'light');
  });

  // 创建系统托盘
  try {
    tray = new Tray(path.join(__dirname, 'pet.webp'));
    const contextMenu = Menu.buildFromTemplate([
      { label: '显示', click: () => mainWindow.show() },
      { label: '退出', click: () => app.quit() }
    ]);
    tray.setToolTip('AI宠物');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
  } catch (err) {
    console.error('[Main] Failed to create tray:', err);
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createPetWindow() {
  petWindow = new BrowserWindow({
    width: 200,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    skipTaskbar: true
  });

  petWindow.loadFile('src/pet.html');

  // 设置窗口位置
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  petWindow.setPosition(width - 220, height - 220);

  // 开发环境打开开发者工具
  if (isDev) {
    petWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createMainWindow();
  createPetWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createPetWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理窗口显示/隐藏
ipcMain.on('toggle-main-window', () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }
});

// 处理主题变化
ipcMain.on('theme-changed', (event, theme) => {
  if (petWindow) {
    petWindow.webContents.send('theme-changed', theme);
  }
});