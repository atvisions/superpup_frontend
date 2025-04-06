import { useState, useEffect } from 'react';
import { MessageService } from '../services/messageService';

interface Message {
    type: 'user' | 'ai';
    content: string;
    time: string;
}

interface ChatState {
    messages: Message[];
}

export const useChat = () => {
    const [state, setState] = useState<ChatState>({
        messages: [{
            type: 'ai',
            content: '你好！我是你的AI助手，有什么我可以帮你的吗？',
            time: new Date().toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        }]
    });

    useEffect(() => {
        if (window.electron) {
            window.electron.receive('chat-response', (response: any) => {
                const message = MessageService.handleResponse(response);
                setState(prev => ({
                    ...prev,
                    messages: [...prev.messages, message]
                }));
            });
        }
    }, []);

    const sendMessage = (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            type: 'user',
            content,
            time: new Date().toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage]
        }));

        MessageService.sendMessage(content);
    };

    return {
        ...state,
        sendMessage
    };
}; 