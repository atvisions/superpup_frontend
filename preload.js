const { contextBridge, ipcRenderer } = require('electron');

// 注册事件监听器
ipcRenderer.on('chat-response', (event, response) => {
  console.log('[Preload] Received chat-response:', response);
});

ipcRenderer.on('chat-error', (event, error) => {
  console.log('[Preload] Received chat-error:', error);
});

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
    // 发送消息到主进程
    send: (channel, data) => {
        console.log('[Preload] Sending message:', { channel, data });
        ipcRenderer.send(channel, data);
    },
    
    // 接收消息
    receive: (channel, callback) => {
        console.log('[Preload] Registering listener for:', channel);
        const subscription = (event, ...args) => {
            console.log('[Preload] Received message on channel:', channel, args);
            callback(...args);
        };
        ipcRenderer.on(channel, subscription);
        
        // 返回清理函数
        return () => {
            console.log('[Preload] Removing listener for:', channel);
            ipcRenderer.removeListener(channel, subscription);
        };
    },
    
    // 监听主题变化
    onThemeUpdated: (callback) => {
        console.log('[Preload] Registering theme listener');
        const subscription = (event, isDark) => {
            console.log('[Preload] Theme updated:', isDark);
            callback(isDark);
        };
        ipcRenderer.on('theme-updated', subscription);
        
        return () => {
            console.log('[Preload] Removing theme listener');
            ipcRenderer.removeListener('theme-updated', subscription);
        };
    },
    
    // 窗口控制
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // 认证相关
    auth: {
        login: (data) => ipcRenderer.invoke('auth', { endpoint: 'login', data }),
        register: (data) => ipcRenderer.invoke('auth', { endpoint: 'register', data }),
        logout: () => ipcRenderer.send('auth-logout'),
        onAuthError: (callback) => {
            const subscription = (event) => callback();
            ipcRenderer.on('auth-error', subscription);
            return () => ipcRenderer.removeListener('auth-error', subscription);
        }
    },
    
    // 聊天相关
    chat: {
        sendMessage: (data) => ipcRenderer.invoke('chat-message', data),
        onResponse: (callback) => {
            const subscription = (event, response) => callback(response);
            ipcRenderer.on('chat-response', subscription);
            return () => ipcRenderer.removeListener('chat-response', subscription);
        },
        onError: (callback) => {
            const subscription = (event, error) => callback(error);
            ipcRenderer.on('chat-error', subscription);
            return () => ipcRenderer.removeListener('chat-error', subscription);
        }
    }
});