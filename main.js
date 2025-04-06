const { app, BrowserWindow, Tray, Menu, ipcMain, systemPreferences, nativeTheme, nativeImage } = require('electron');
const path = require('path');
const axios = require('axios');
const isDev = process.env.NODE_ENV === 'development';
require('dotenv').config();

// 后端API配置
const BACKEND_API = 'http://127.0.0.1:8000';
console.log('[Main] Backend API URL:', BACKEND_API);

let authToken = null;

// 创建并获取应用图标
function createAppIcon() {
    let iconPath;
    let trayIconPath;

    // 判断是开发环境还是生产环境
    if (!app.isPackaged) {
        // 开发环境
        iconPath = path.join(__dirname, 'src', 'assets', 'icon.png');
        trayIconPath = path.join(__dirname, 'src', 'assets', 'tray-icon.png');
    } else {
        // 生产环境 - 从 resources 目录加载
        iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
        trayIconPath = path.join(process.resourcesPath, 'assets', 'tray-icon.png');
    }
    
    console.log('[Main] Environment:', app.isPackaged ? 'Production' : 'Development');
    console.log('[Main] App path:', app.getAppPath());
    console.log('[Main] Resources path:', process.resourcesPath);
    console.log('[Main] Icon path:', iconPath);
    console.log('[Main] Icon exists:', require('fs').existsSync(iconPath));
    
    try {
        // 加载主图标（用于 Dock 和窗口）
        const icon = nativeImage.createFromPath(iconPath);
        // 加载托盘图标
        const trayIconSource = nativeImage.createFromPath(trayIconPath);
        
        if (!icon.isEmpty()) {
            // 调整图标大小
            const dockIcon = icon.resize({ width: 64, height: 64 });
            const windowIcon = icon.resize({ width: 64, height: 64 }); 
            
            // 托盘图标尺寸
            const trayIcon = !trayIconSource.isEmpty() 
                ? trayIconSource.resize({ width: 16, height: 16 })
                : icon.resize({ width: 16, height: 16 });
            
            return {
                dock: dockIcon,
                tray: trayIcon,
                window: windowIcon
            };
        }
    } catch (err) {
        console.error('[Main] Failed to create app icon:', err);
    }
    return null;
}

// 设置应用图标
const appIcon = createAppIcon();
if (process.platform === 'darwin' && appIcon) {
    app.dock.setIcon(appIcon.dock);
}

// 处理认证请求
ipcMain.on('auth', async (event, { endpoint, data }) => {
    try {
        const response = await axios.post(`${BACKEND_API}/api/auth/${endpoint}/`, data);
        if (response.data && response.data.token) {
            authToken = response.data.token;
            event.reply('auth-response', {
                success: true,
                token: response.data.token
            });
        } else {
            event.reply('auth-response', {
                success: false,
                error: '认证失败'
            });
        }
    } catch (error) {
        console.error('[Main] Auth error:', error);
        event.reply('auth-response', {
            success: false,
            error: error.response?.data?.detail || '认证失败'
        });
    }
});

// 更新认证 token
ipcMain.on('auth-token-updated', (event, token) => {
    authToken = token;
});

// 发送消息到Django后端
async function sendToBackend(data) {
    console.log('[Main] Preparing to send message to backend');
    try {
        // 根据消息类型选择不同的端点
        let url;
        if (data.type === 'image') {
            url = `${BACKEND_API}/api/chat/conversations/1/send_message/`;
        } else {
            url = `${BACKEND_API}/api/chat/conversations/1/send_message/`;
        }
        console.log('[Main] Sending request to:', url);
        
        // 构建请求数据
        const requestData = {
            message: data.message,
            model: data.model || 'deepseek-r1',
            type: data.type || 'text'
        };
        
        console.log('[Main] Request payload:', requestData);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*'
        };

        // 如果有认证 token，添加到请求头
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await axios.post(url, requestData, {
            headers,
            timeout: 90000,
            withCredentials: false,
            validateStatus: function (status) {
                return status >= 200 && status < 500;
            }
        });
        
        console.log('[Main] Backend response status:', response.status);
        console.log('[Main] Backend response headers:', response.headers);
        console.log('[Main] Backend response data:', response.data);

        // 处理认证错误
        if (response.status === 401 || response.status === 403) {
            mainWindow.webContents.send('auth-error');
            return {
                success: false,
                error: '请先登录'
            };
        }
        
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

            // 处理认证错误
            if (error.response.status === 401 || error.response.status === 403) {
                mainWindow.webContents.send('auth-error');
                return {
                    success: false,
                    error: '请先登录'
                };
            }

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
ipcMain.on('chat', async (event, data) => {
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

// 处理窗口最大化
ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

let mainWindow = null;
let tray;

// 创建主窗口
async function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        show: false,
        backgroundColor: '#ffffff'
    });

    // 加载应用
    if (isDev) {
        await mainWindow.loadURL('http://localhost:3001');
        mainWindow.webContents.openDevTools();
    } else {
        await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    // 窗口准备好后显示
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // 窗口关闭时的处理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 监听窗口状态变化
    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window-maximized');
    });

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window-unmaximized');
    });

    return mainWindow;
}

// 应用准备就绪时创建窗口
app.whenReady().then(async () => {
    try {
        await createMainWindow();
        console.log('Main window created');
    } catch (error) {
        console.error('Failed to create main window:', error);
    }
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 激活应用时重新创建窗口
app.on('activate', async () => {
    if (mainWindow === null) {
        try {
            await createMainWindow();
            console.log('Main window recreated');
        } catch (error) {
            console.error('Failed to recreate main window:', error);
        }
    } else {
        mainWindow.show();
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