import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import './App.css';

const App: React.FC = () => {
    const [currentModel, setCurrentModel] = useState('deepseek-r1');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // 监听主题变化
        if (window.electron) {
            window.electron.receive('theme-updated', (isDark: boolean) => {
                setIsDarkMode(isDark);
            });
        }
    }, []);

    const handleModelChange = (model: string) => {
        setCurrentModel(model);
        if (window.electron) {
            window.electron.send('switch-mode', model === 'doubao' ? 'image' : 'text');
        }
    };

    return (
        <div className={`app ${isDarkMode ? 'dark' : ''}`}>
            <div className="sidebar">
                <div className="model-selector">
                    <button
                        className={`model-button ${currentModel === 'deepseek-r1' ? 'active' : ''}`}
                        onClick={() => handleModelChange('deepseek-r1')}
                    >
                        <i className="ri-chat-1-line"></i>
                        <span>对话</span>
                    </button>
                    <button
                        className={`model-button ${currentModel === 'doubao' ? 'active' : ''}`}
                        onClick={() => handleModelChange('doubao')}
                    >
                        <i className="ri-image-line"></i>
                        <span>图像生成</span>
                    </button>
                </div>
            </div>
            <div className="main-content">
                <Chat />
            </div>
        </div>
    );
};

export default App; 