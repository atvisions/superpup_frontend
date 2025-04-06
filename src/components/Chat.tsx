import React, { useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
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
    type: 'user' | 'pet' | 'system' | 'ai' | 'image';
    content: string | React.ReactNode;
    time: string;
    isAuthError?: boolean;
}

interface ChatProps {
    onAuthError: () => void;
}

const Chat: React.FC<ChatProps> = ({ onAuthError }) => {
    const { messages, isLoading, currentModel, isImageMode, sendMessage } = useChat();
    const inputRef = useRef<HTMLInputElement>(null);
    const [showModelMenu, setShowModelMenu] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const input = inputRef.current;
        if (input && input.value.trim()) {
            sendMessage(input.value.trim());
            input.value = '';
        }
    };

    const handleModelSelect = (model: string) => {
        if (window.electron) {
            window.electron.send('switch-model', model);
        }
        setShowModelMenu(false);
    };

    return (
        <div className="chat-page">
            <div className="tags-container">
                <div className="tags-wrapper">
                    <div className={`tag ${!isImageMode ? 'active' : ''}`} onClick={() => window.electron?.send('switch-mode', 'text')}>
                        <i className="ri-chat-smile-2-line"></i>
                        <span>聊闲话</span>
                    </div>
                    <div className={`tag ${isImageMode ? 'active' : ''}`} onClick={() => window.electron?.send('switch-mode', 'image')}>
                        <i className="ri-image-edit-line"></i>
                        <span>图像生成</span>
                    </div>
                    <div className="tag">
                        <i className="ri-search-line"></i>
                        <span>AI搜索</span>
                    </div>
                    <div className="tag">
                        <i className="ri-book-read-line"></i>
                        <span>AI阅读</span>
                    </div>
                    <div className="tag">
                        <i className="ri-code-line"></i>
                        <span>AI编程</span>
                    </div>
                    <div className="tag">
                        <i className="ri-translate-2"></i>
                        <span>翻译</span>
                    </div>
                </div>
                <div className="tags-edit">
                    <i className="ri-settings-line"></i>
                </div>
            </div>

            <div className="messages-container">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                        <img
                            src={message.type === 'user' ? './assets/user.webp' : './assets/ai.webp'}
                            alt={message.type === 'user' ? '用户头像' : 'AI头像'}
                            className="avatar"
                        />
                        <div className="message-content">
                            <div className="message-text">
                                {message.isAuthError ? (
                                    <div className="auth-message">
                                        请先<span className="login-text" onClick={() => onAuthError()}>登录</span>后再继续对话
                                    </div>
                                ) : (
                                    typeof message.content === 'string' ? message.content : message.content
                                )}
                            </div>
                            <div className="message-time">{message.time}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="input-wrapper">
                <form onSubmit={handleSubmit} className="input-container">
                    <div className={`input-box ${isImageMode ? 'image-mode' : ''}`}>
                        <div className="input-area">
                            {isImageMode && (
                                <div className="input-prefix">
                                    <i className="ri-arrow-left-line" onClick={() => window.electron?.send('switch-mode', 'text')}></i>
                                    <span>@图像生成</span>
                                </div>
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={isImageMode ? '描述你所想象的画面，角色，情绪，场景，风格...' : '你可以问我任何问题...'}
                            />
                        </div>
                        <div className="input-bottom">
                            <div className={`model-selector ${showModelMenu ? 'active' : ''}`} onClick={() => setShowModelMenu(!showModelMenu)}>
                                <img src={`./assets/${currentModel}.png`} alt={currentModel} className="model-logo" />
                                <span>{currentModel}</span>
                                <i className="ri-arrow-down-s-line"></i>
                                {showModelMenu && (
                                    <div className="model-menu">
                                        <div className={`model-item ${currentModel === 'deepseek-r1' ? 'active' : ''}`} onClick={() => handleModelSelect('deepseek-r1')}>
                                            <img src="./assets/deepseek.png" alt="Deepseek" />
                                            <span>Deepseek-R1</span>
                                        </div>
                                        <div className={`model-item ${currentModel === 'deepseek-v3' ? 'active' : ''}`} onClick={() => handleModelSelect('deepseek-v3')}>
                                            <img src="./assets/deepseek.png" alt="Deepseek" />
                                            <span>Deepseek-v3</span>
                                        </div>
                                        <div className={`model-item ${currentModel === 'doubao' ? 'active' : ''}`} onClick={() => handleModelSelect('doubao')}>
                                            <img src="./assets/doubao.png" alt="豆包" />
                                            <span>豆包</span>
                                        </div>
                                        <div className={`model-item ${currentModel === 'ernie' ? 'active' : ''}`} onClick={() => handleModelSelect('ernie')}>
                                            <img src="./assets/ernie.png" alt="文心一言" />
                                            <span>文心一言</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="input-right">
                                <div className="input-actions">
                                    <div className="input-action">
                                        <i className="ri-image-line"></i>
                                    </div>
                                    <div className="input-action">
                                        <i className="ri-attachment-2"></i>
                                    </div>
                                    <div className="input-action">
                                        <i className="ri-mic-line"></i>
                                    </div>
                                </div>
                                <button type="submit" className="send-button">
                                    <i className="ri-send-plane-fill"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat; 