import { useCallback } from 'react';
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

    try {
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
    } catch (error) {
      console.error('Failed to initialize chatbot config:', error);
      return false;
    }
  }, [chatbotToken, user]);

  const loadChatbotScript = useCallback(() => {
    if (!chatbotToken || document.getElementById(chatbotToken)) {
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://udify.app/embed.min.js';
      script.id = chatbotToken;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      // Add error handling
      script.onerror = (error) => {
        console.warn('Dify chatbot script failed to load. This may be due to network issues or CORS policy.');
        // Remove the failed script
        script.remove();
      };
      
      script.onload = () => {
        console.log('Dify chatbot script loaded successfully');
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.warn('Failed to create chatbot script:', error);
    }
  }, [chatbotToken]);

  const addChatbotStyles = useCallback(() => {
    if (document.querySelector('style[data-dify-chatbot]')) {
      return;
    }

    try {
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
    } catch (error) {
      console.error('Failed to add chatbot styles:', error);
    }
  }, []);

  const setupChatbot = useCallback(() => {
    if (initializeChatbot()) {
      loadChatbotScript();
      addChatbotStyles();
    }
  }, [initializeChatbot, loadChatbotScript, addChatbotStyles]);

  const cleanupChatbot = useCallback(() => {
    try {
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
    } catch (error) {
      console.error('Failed to cleanup chatbot:', error);
    }
  }, [chatbotToken]);

  return {
    setupChatbot,
    cleanupChatbot,
    isConfigured: !!chatbotToken,
    user,
  };
}