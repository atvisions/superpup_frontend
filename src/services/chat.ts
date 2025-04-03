import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/chat';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器，添加认证token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const chatApi = {
  // 获取所有聊天
  getChats: () => api.get<Chat[]>('/chats/'),

  // 创建新聊天
  createChat: (title: string) => api.post<Chat>('/chats/', { title }),

  // 获取单个聊天
  getChat: (id: number) => api.get<Chat>(`/chats/${id}/`),

  // 发送消息
  sendMessage: (chatId: number, content: string) => 
    api.post<{ user_message: Message; assistant_message: Message }>(
      `/chats/${chatId}/send_message/`,
      { content }
    ),

  // 获取聊天消息
  getMessages: (chatId: number) => api.get<Message[]>(`/chats/${chatId}/messages/`),
}; 