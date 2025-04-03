import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

// 添加 electron 的类型定义
declare global {
    interface Window {
        electron?: {
            send: (channel: string, data: any) => void;
            receive: (channel: string, func: (data: any) => void) => void;
            onError: (func: (error: string) => void) => void;
        };
    }
}

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
    const [isImageMode, setIsImageMode] = useState(false);
    const [currentModel, setCurrentModel] = useState('deepseek-r1');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log('[Chat] Component mounted');
        console.log('[Chat] window.electron exists:', !!window.electron);
        
        // 监听消息响应
        if (window.electron) {
            console.log('[Chat] Setting up chat-message-response listener');
            window.electron.receive('chat-message-response', (response: any) => {
                console.log('[Chat] Received message response:', response);
                if (response.success) {
                    setMessages(prev => [...prev, {
                        type: response.type || 'ai',
                        content: response.response.message,
                        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                    }]);
                }
                setIsLoading(false);
            });

            // 监听错误
            console.log('[Chat] Setting up error listener');
            window.electron.onError((error: string) => {
                console.error('[Chat] Received error:', error);
                setMessages(prev => [...prev, {
                    type: 'ai',
                    content: error,
                    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                }]);
                setIsLoading(false);
            });

            // 监听模式切换
            console.log('[Chat] Setting up switch-mode listener');
            window.electron.receive('switch-mode', (mode: string) => {
                console.log('[Chat] Switching to mode:', mode);
                setIsImageMode(mode === 'image');
                if (mode === 'image') {
                    setCurrentModel('doubao');
                }
                setInputMessage('');
            });
        } else {
            console.error('[Chat] window.electron is not available');
        }
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        console.log('[Chat] Sending message:', inputMessage);
        console.log('[Chat] Current mode:', isImageMode ? 'image' : 'text');
        console.log('[Chat] Current model:', currentModel);
        
        const newMessage: Message = {
            type: 'user',
            content: inputMessage,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        setIsLoading(true);

        // 发送消息到后端
        if (window.electron) {
            const messageData = {
                message: inputMessage,
                type: isImageMode ? 'image' : 'text',
                model: isImageMode ? 'doubao' : currentModel
            };
            console.log('[Chat] Sending message data:', messageData);
            window.electron.send('chat-message', messageData);
        } else {
            console.error('[Chat] Cannot send message: window.electron is not available');
            setIsLoading(false);
        }
    };

    const handleExitImageMode = () => {
        console.log('[Chat] Exiting image mode');
        setIsImageMode(false);
        setInputMessage('');
        if (window.electron) {
            window.electron.send('switch-mode', 'text');
        }
    };

    return (
        <div className="chat-container">
            {isImageMode && (
                <div className="image-mode-header">
                    <span className="image-mode-text">@图像生成</span>
                    <button className="exit-image-mode" onClick={handleExitImageMode}>
                        <i className="ri-arrow-left-line"></i>
                    </button>
                </div>
            )}
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type === 'user' ? 'user' : 'ai'}`}>
                        <div className="message-content">
                            {message.type === 'image' ? (
                                <img src={message.content} alt="AI生成的图片" className="generated-image" />
                            ) : (
                                message.content
                            )}
                        </div>
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
                    placeholder={isImageMode ? "描述你想要生成的图片..." : "输入消息..."}
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