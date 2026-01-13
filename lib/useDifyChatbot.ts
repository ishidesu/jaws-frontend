import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DifyChatbotConfig {
  token: string;
  inputs?: Record<string, any>;
  systemVariables?: {
    user_id?: string;
    conversation_id?: string;
  };
  userVariables?: {
    avatar_url?: string;
    name?: string;
  };
}

export function useDifyChatbot() {
  const { user } = useAuth();
  const chatbotToken = process.env.NEXT_PUBLIC_DIFY_CHATBOT_TOKEN;

  const initializeChatbot = useCallback(() => {
    if (!chatbotToken) {
      console.warn('Dify chatbot token not configured');
      return false;
    }

    const config: DifyChatbotConfig = {
      token: chatbotToken,
      inputs: {
      },
      systemVariables: {
        user_id: user?.id,
      },
      userVariables: {
        name: user?.username,
      },
    };

    (window as any).difyChatbotConfig = config;
    
    return true;
  }, [chatbotToken, user]);

  const loadChatbotScript = useCallback(() => {
    if (!chatbotToken || document.getElementById(chatbotToken)) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://udify.app/embed.min.js';
    script.id = chatbotToken;
    script.defer = true;
    
    document.body.appendChild(script);
  }, [chatbotToken]);

  const addChatbotStyles = useCallback(() => {
    if (document.querySelector('style[data-dify-chatbot]')) {
      return;
    }

    const style = document.createElement('style');
    style.setAttribute('data-dify-chatbot', 'true');
    style.textContent = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
      }
    `;
    
    document.head.appendChild(style);
  }, []);

  const setupChatbot = useCallback(() => {
    if (initializeChatbot()) {
      loadChatbotScript();
      addChatbotStyles();
    }
  }, [initializeChatbot, loadChatbotScript, addChatbotStyles]);

  const cleanupChatbot = useCallback(() => {
    const script = document.getElementById(chatbotToken || '');
    if (script) {
      script.remove();
    }

    const style = document.querySelector('style[data-dify-chatbot]');
    if (style) {
      style.remove();
    }

    if ((window as any).difyChatbotConfig) {
      delete (window as any).difyChatbotConfig;
    }
  }, [chatbotToken]);

  return {
    setupChatbot,
    cleanupChatbot,
    isConfigured: !!chatbotToken,
    user,
  };
}