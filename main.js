const { app, BrowserWindow, Tray, Menu, ipcMain, systemPreferences, nativeTheme } = require('electron');
const path = require('path');
const axios = require('axios');
const isDev = process.env.NODE_ENV === 'development';
require('dotenv').config();

// 后端API配置
const BACKEND_API = 'http://127.0.0.1:8000';
console.log('[Main] Backend API URL:', BACKEND_API);

// 发送消息到Django后端
async function sendToBackend(data) {
  console.log('[Main] Preparing to send message to backend');
  try {
    // 根据消息类型选择不同的端点
    const endpoint = data.type === 'image' ? 'image/' : 'message/';
    const url = `${BACKEND_API}/api/chat/${endpoint}`;
    console.log('[Main] Sending request to:', url);
    
    // 构建请求数据
    const requestData = {
      message: data.message,
      model: data.model || 'deepseek-r1',  // 默认使用 deepseek-r1
      type: data.type || 'text'  // 默认使用文本类型
    };
    
    console.log('[Main] Request payload:', requestData);
    
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      timeout: 90000,
      withCredentials: false,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });
    
    console.log('[Main] Backend response status:', response.status);
    console.log('[Main] Backend response headers:', response.headers);
    console.log('[Main] Backend response data:', response.data);
    
    // 检查响应格式
    if (response.data && typeof response.data === 'object') {
      // 如果响应中包含错误信息，直接返回错误
      if (response.data.error) {
        return {
          success: false,
          error: response.data.error
        };
      }
      
      // 如果响应中包含消息内容，返回成功
      if (response.data.message || response.data.content || response.data.text) {
        return {
          success: true,
          content: response.data.message || response.data.content || response.data.text,
          type: response.data.type || 'text'
        };
      }
      
      // 如果响应中没有错误也没有内容，返回默认错误
      return {
        success: false,
        error: '服务器返回的响应格式不正确'
      };
    }
    
    // 如果响应不是对象，返回错误
    return {
      success: false,
      error: '服务器返回的响应格式不正确'
    };
  } catch (error) {
    console.error('[Main] Error sending message to backend:', error);
    if (error.response) {
      console.error('[Main] Backend error response:', error.response.data);
      console.error('[Main] Backend error status:', error.response.status);
      console.error('[Main] Backend error headers:', error.response.headers);
      return {
        success: false,
        error: error.response.data.error || '服务器错误'
      };
    }
    if (error.request) {
      console.error('[Main] No response received:', error.request);
      return {
        success: false,
        error: '无法连接到服务器，请检查网络连接'
      };
    }
    return {
      success: false,
      error: error.message || '发送消息失败'
    };
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

// 处理聊天消息
ipcMain.on('chat-message', async (event, data) => {
    console.log('Received chat message:', data);
    
    try {
        // 发送消息到后端
        const response = await sendToBackend(data);
        
        // 发送响应到渲染进程
        event.reply('chat-response', response);
    } catch (error) {
        console.error('Error processing chat message:', error);
        event.reply('chat-response', {
            success: false,
            error: error.message || '处理消息时出错'
        });
    }
});

// 处理场景切换
ipcMain.on('switch-mode', async (event, mode) => {
  try {
    console.log('[Main] Switching mode to:', mode);
    
    // 发送成功响应
    event.reply('switch-mode-response', {
      success: true,
      mode: mode,
      prefix: mode === 'image' ? '@图像生成' : '',
      placeholder: mode === 'image' ? '描述你所想象的画面，角色，情绪，场景，风格...' : '你可以问我任何问题...'
    });
    
    console.log('[Main] Sent mode switch response:', {
      mode: mode,
      prefix: mode === 'image' ? '@图像生成' : '',
      placeholder: mode === 'image' ? '描述你所想象的画面，角色，情绪，场景，风格...' : '你可以问我任何问题...'
    });
  } catch (error) {
    console.error('[Main] Error switching mode:', error);
    event.reply('switch-mode-response', {
      success: false,
      error: error.message
    });
  }
});

let mainWindow;
let tray;

// 创建主窗口
async function createMainWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        frame: false,  // 无边框窗口
        titleBarStyle: 'hiddenInset',  // 隐藏标题栏但保留窗口控制按钮
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'src/assets/pet.webp'),  // 设置应用图标
        backgroundColor: '#ffffff'  // 设置背景色
    });

    // 加载应用的 index.html
    if (isDev) {
        await mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        await mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    }

    // 检测系统主题
    const isDarkMode = nativeTheme.shouldUseDarkColors;
    mainWindow.webContents.on('did-finish-load', () => {
        // 发送主题状态
        mainWindow.webContents.send('theme-updated', nativeTheme.shouldUseDarkColors);
        
        // 发送默认欢迎消息
        setTimeout(() => {
            const welcomeMessage = {
                success: true,
                content: `你好！我是你的AI助手。我可以：
1. 回答你的问题
2. 查询天气信息
3. 规划路线
4. 生成图片

有什么我可以帮你的吗？`
            };
            mainWindow.webContents.send('chat-response', welcomeMessage);
            console.log('Sent welcome message');
        }, 1000);
    });

    // 监听系统主题变化
    nativeTheme.on('updated', () => {
        const isDarkMode = nativeTheme.shouldUseDarkColors;
        mainWindow.webContents.send('theme-updated', isDarkMode);
    });

    // 创建系统托盘
    try {
        tray = new Tray(path.join(__dirname, 'src/assets/pet.webp'));
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

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
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