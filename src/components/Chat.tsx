import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

interface Message {
    type: string;
    content: string;
    time: string;
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            type: 'pet',
            content: '你好！我是你的AI宠物，很高兴见到你！有什么我可以帮你的吗？',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        console.log('[Chat] Setting up event listeners');
        // 监听消息响应
        const cleanupResponse = window.electron.onMessageResponse((response: any) => {
            console.log('[Chat] Received message response:', response);
            if (response.success) {
                setMessages(prev => [...prev, {
                    type: 'ai',
                    content: response.response.message,
                    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                }]);
            }
            setIsLoading(false);
        });

        // 监听错误
        const cleanupError = window.electron.onError((error: string) => {
            console.error('[Chat] Received error:', error);
            setMessages(prev => [...prev, {
                type: 'ai',
                content: error,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            }]);
            setIsLoading(false);
        });

        return () => {
            console.log('[Chat] Cleaning up event listeners');
            cleanupResponse();
            cleanupError();
        };
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        console.log('[Chat] Sending message:', inputMessage);
        const newMessage: Message = {
            type: 'user',
            content: inputMessage,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        setIsLoading(true);

        // 发送消息到后端
        window.electron.sendMessage(inputMessage);
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type === 'user' ? 'user' : 'ai'}`}>
                        <div className="message-content">{message.content}</div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message ai">
                        <div className="message-content loading">正在思考...</div>
                    </div>
                )}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="输入消息..."
                    disabled={isLoading}
                    className="chat-input"
                    ref={inputRef}
                />
                <button type="submit" disabled={isLoading} className="send-button">
                    发送
                </button>
            </form>
        </div>
    );
};

export default Chat; 