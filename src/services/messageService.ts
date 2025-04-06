interface Message {
    type: 'user' | 'ai';
    content: string;
    time: string;
}

interface MessageResponse {
    success: boolean;
    content?: string;
    error?: string;
}

export const MessageService = {
    sendMessage: (message: string) => {
        if (!window.electron) {
            console.error('Electron is not available');
            return;
        }
        
        window.electron.send('chat', {
            message,
            type: 'text',
            model: 'deepseek-r1'
        });
    },

    handleResponse: (response: MessageResponse): Message => {
        const time = new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        if (!response.success) {
            return {
                type: 'ai',
                content: response.error || '发生错误，请重试',
                time
            };
        }

        return {
            type: 'ai',
            content: response.content || '',
            time
        };
    }
}; 