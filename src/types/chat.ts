export interface Message {
    type: 'user' | 'ai' | 'system' | 'image';
    content: string | React.ReactNode;
    time: string;
    isAuthError?: boolean;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    currentModel: string;
    isImageMode: boolean;
} 