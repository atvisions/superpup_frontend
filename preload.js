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
        console.log('Sending message:', { channel, data });
        ipcRenderer.send(channel, data);
    },
    
    // 接收消息
    on: (channel, callback) => {
        console.log('Registering listener for:', channel);
        const subscription = (event, ...args) => {
            console.log('Received message on channel:', channel, args);
            callback(...args);
        };
        ipcRenderer.on(channel, subscription);
        
        // 返回清理函数
        return () => {
            console.log('Removing listener for:', channel);
            ipcRenderer.removeListener(channel, subscription);
        };
    },
    
    // 监听主题变化
    onThemeUpdated: (callback) => {
        console.log('Registering theme listener');
        const subscription = (event, isDark) => {
            console.log('Theme updated:', isDark);
            callback(isDark);
        };
        ipcRenderer.on('theme-updated', subscription);
        
        return () => {
            console.log('Removing theme listener');
            ipcRenderer.removeListener('theme-updated', subscription);
        };
    },
    
    // 窗口控制
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window')
});