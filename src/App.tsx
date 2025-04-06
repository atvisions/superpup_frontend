import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import icon from './assets/logo_black.png';
import deepseekLogo from './assets/deepseek.png';
import doubaoLogo from './assets/doubao.png';
import ernieLogo from './assets/ernie.png';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any; // 临时使用 any 类型来解决 TypeScript 报错
}

const agents: Agent[] = [
  {
    id: 'deepseek-r1',
    name: 'Deepseek R1',
    description: '通用大语言模型',
    icon: deepseekLogo
  },
  {
    id: 'deepseek-v3',
    name: 'Deepseek V3',
    description: '代码专家',
    icon: deepseekLogo
  },
  {
    id: 'doubao',
    name: '豆包',
    description: '创意助手',
    icon: doubaoLogo
  },
  {
    id: 'ernie',
    name: '文心一言',
    description: '中文助手',
    icon: ernieLogo
  }
];

function App() {
  const [message, setMessage] = useState('');
  const [isAgentSelectOpen, setIsAgentSelectOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const agentSelectRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    
    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.nav-section, .sidebar-footer')) {
        return;
      }
      
      const appElement = document.querySelector('.app') as HTMLElement;
      if (appElement) {
        appElement.style.setProperty('-webkit-app-region', 'drag');
      }
    };
    
    const handleMouseUp = () => {
      const appElement = document.querySelector('.app') as HTMLElement;
      if (appElement) {
        appElement.style.setProperty('-webkit-app-region', 'no-drag');
      }
    };
    
    sidebar?.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      sidebar?.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agentSelectRef.current && !agentSelectRef.current.contains(event.target as Node)) {
        setIsAgentSelectOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: 发送消息
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAgentSelect = () => {
    const selectElement = agentSelectRef.current;
    if (!selectElement) return;

    const dropdownElement = selectElement.querySelector('.agent-dropdown') as HTMLElement;
    if (!dropdownElement) return;

    if (!isAgentSelectOpen) {
      const rect = selectElement.getBoundingClientRect();
      const dropdownHeight = 320;
      const spaceAbove = rect.top;
      const actualHeight = Math.min(dropdownHeight, spaceAbove - 10);
      
      dropdownElement.style.bottom = `${window.innerHeight - rect.top + 4}px`;
      dropdownElement.style.left = `${rect.left}px`;
      dropdownElement.style.maxHeight = `${actualHeight}px`;
    }
    
    setIsAgentSelectOpen(!isAgentSelectOpen);
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsAgentSelectOpen(false);
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-content">
          <h1 className="app-logo">
            <img src={icon} alt="Superpup Logo" />
            <div className="app-logo-text">
              <span className="app-logo-title">超级小狗</span>
              <span className="app-logo-subtitle">你的私人AI助手</span>
            </div>
          </h1>
          
          <nav className="nav-section">
            <a href="#" className="nav-item active">
              <i className="ri-message-3-line"></i>
              <i className="ri-message-3-fill"></i>
              <span>聊天</span>
            </a>
            <a href="#" className="nav-item">
              <i className="ri-palette-line"></i>
              <i className="ri-palette-fill"></i>
              <span>图片</span>
            </a>
            <a href="#" className="nav-item">
              <i className="ri-film-line"></i>
              <i className="ri-film-fill"></i>
              <span>视频</span>
            </a>
            <a href="#" className="nav-item">
              <i className="ri-headphone-line"></i>
              <i className="ri-headphone-fill"></i>
              <span>音乐</span>
            </a>
            <a href="#" className="nav-item">
              <i className="ri-file-user-line"></i>
              <i className="ri-file-user-fill"></i>
              <span>简历</span>
            </a>
          </nav>

          <div className="chat-history">
            <div className="history-title">
              <span>对话记录</span>
              <svg width="16" height="16" viewBox="0 0 256 256">
                <title>新建对话</title>
                <path fill="currentColor" d="M128 22C69.458 22 22 69.458 22 128v96c0 5.523 4.477 10 10 10h96c58.542 0 106-47.458 106-106S186.542 22 128 22Zm0 56c5.523 0 10 4.477 10 10v30h30c5.523 0 10 4.477 10 10s-4.477 10-10 10h-30v30c0 5.523-4.477 10-10 10s-10-4.477-10-10v-30H88c-5.523 0-10-4.477-10-10s4.477-10 10-10h30V88c0-5.523 4.477-10 10-10Z" clipRule="evenodd" fillRule="evenodd"/>
              </svg>
            </div>
            <a href="#" className="nav-item">
              <i className="ri-time-line"></i>
              <span>如何提高工作效率？</span>
            </a>
            <a href="#" className="nav-item">
              <i className="ri-time-line"></i>
              <span>帮我写一篇周报</span>
            </a>
            <a href="#" className="nav-item">
              <i className="ri-time-line"></i>
              <span>如何学习英语？</span>
            </a>
          </div>
          
          <div className="sidebar-footer">
            <button className="tool-button">
              <i className="ri-device-line"></i>
            </button>
            <button className="tool-button">
              <i className="ri-question-line"></i>
            </button>
            <button className="tool-button">
              <i className="ri-settings-3-line"></i>
            </button>
            <div className="user-avatar">J</div>
          </div>
        </div>
      </div>
      
      <div className="main">
        <div className="message-container">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1">Hi James 👋</h1>
            <p className="text-gray-600">How can I help you today?</p>
          </div>
        </div>
        
        <div className="input-container">
          <div className="skills-bar">
            <div className="skills-list">
              <div 
                ref={agentSelectRef}
                className={`agent-select ${isAgentSelectOpen ? 'open' : ''}`}
                onClick={toggleAgentSelect}
              >
                <div className="avatar">
                  <img src={selectedAgent.icon} alt={selectedAgent.name} />
                </div>
                <span>{selectedAgent.name}</span>
                <i className="ri-arrow-down-s-line arrow"></i>
                
                <div className="agent-dropdown" style={{ display: isAgentSelectOpen ? 'block' : 'none' }}>
                  {agents.map((agent) => (
                    <div 
                      key={agent.id}
                      className="agent-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAgentSelect(agent);
                      }}
                    >
                      <div className="avatar">
                        <img src={agent.icon} alt={agent.name} />
                      </div>
                      <div className="info">
                        <div className="name">{agent.name}</div>
                        <div className="type">{agent.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="skill-tag active">
                <i className="ri-translate-2"></i>
                <span>翻译</span>
              </div>
              <div className="skill-tag">
                <i className="ri-file-text-line"></i>
                <span>文档</span>
              </div>
              <div className="skill-tag">
                <i className="ri-file-ppt-2-line"></i>
                <span>PPT</span>
              </div>
              <div className="skill-tag">
                <i className="ri-image-line"></i>
                <span>图像</span>
              </div>
              <div className="skill-tag">
                <i className="ri-code-line"></i>
                <span>代码</span>
              </div>
            </div>
            <div className="coins-manage">
              <i className="ri-settings-3-line"></i>
            </div>
          </div>

          <div className="input-wrapper">
            <textarea
              className="input-area"
              placeholder="发消息，输入 @ 选择技能或/选择文件"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="input-tools">
              <div className="left-tools">
                <button title="表情">
                  <i className="ri-emotion-line"></i>
                </button>
              </div>
              <div className="right-tools">
                <button title="上传图片">
                  <i className="ri-image-add-line"></i>
                </button>
                <button title="附件">
                  <i className="ri-attachment-2"></i>
                </button>
                <button title="语音输入">
                  <i className="ri-mic-line"></i>
                </button>
                <button className="send-button" onClick={handleSend} title="发送">
                  <i className="ri-send-plane-fill"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div className="shortcuts-hint">
            Enter + 发送 · Shift + Enter 换行
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;