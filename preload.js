const { contextBridge, ipcRenderer } = require('electron');

// 注册事件监听器
ipcRenderer.on('chat-message-response', (event, response) => {
  console.log('[Preload] Received chat-message-response:', response);
});

ipcRenderer.on('chat-error', (event, error) => {
  console.log('[Preload] Received chat-error:', error);
});

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
    // 发送消息到主进程
    send: (channel, data) => {
        console.log('[Preload] Sending chat-message:', data);
        ipcRenderer.send(channel, data);
    },
    
    // 接收消息响应
    receive: (channel, func) => {
        console.log('[Preload] Setting up chat-message-response listener');
        ipcRenderer.on(channel, (event, ...args) => {
            console.log('[Preload] Received chat-message-response:', args[0]);
            func(...args);
        });
    },
    
    // 接收错误信息
    onError: (callback) => {
        console.log('[Preload] Setting up chat-error listener');
        ipcRenderer.on('chat-error', (event, error) => {
            console.log('[Preload] Received chat-error:', error);
            callback(error);
        });
    },
    
    // 窗口控制
    minimize: () => {
        console.log('[Preload] Sending minimize-window event');
        ipcRenderer.send('minimize-window');
    },
    close: () => {
        console.log('[Preload] Sending close-window event');
        ipcRenderer.send('close-window');
    },
    
    // 主题相关
    onThemeUpdated: (callback) => {
        console.log('[Preload] Setting up theme listener');
        ipcRenderer.on('theme-changed', (event, theme) => {
            console.log('[Preload] Theme updated:', theme);
            callback(theme === 'dark');
        });
    }
});