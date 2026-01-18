import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DifyChatbotConfig {
  token: string;
  baseUrl?: string;
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
  const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY;
  const apiServer = process.env.NEXT_PUBLIC_DIFY_API_SERVER || 'https://api.dify.ai/v1';

  const initializeChatbot = useCallback(() => {
    if (!apiKey) {
      console.warn('Dify API key not configured');
      return false;
    }

    try {
      const config: DifyChatbotConfig = {
        token: apiKey,
        baseUrl: apiServer,
        inputs: {},
        systemVariables: {
          user_id: user?.id || '',
        },
        userVariables: {
          name: user?.username || 'Guest',
        },
      };

      (window as any).difyChatbotConfig = config;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize chatbot config:', error);
      return false;
    }
  }, [apiKey, apiServer, user]);

  const loadChatbotScript = useCallback(() => {
    if (!apiKey || document.getElementById('dify-chatbot-script')) {
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://udify.app/embed.min.js';
      script.id = 'dify-chatbot-script';
      script.defer = true;
      
      script.onerror = () => {
        console.error('Dify chatbot script failed to load');
      };
      
      script.onload = () => {
        console.log('Dify chatbot script loaded successfully');
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.warn('Failed to create chatbot script:', error);
    }
  }, [apiKey]);

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
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        }
        #dify-chatbot-bubble-button:hover {
          background-color: #1557d8 !important;
        }
        #dify-chatbot-bubble-window {
          width: 24rem !important;
          height: 40rem !important;
          max-height: 90vh !important;
        }
        @media (max-width: 640px) {
          #dify-chatbot-bubble-window {
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
          }
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
    // Note: Intentionally minimal cleanup to keep chatbot persistent
    // Only cleanup config, not the script itself
    try {
      if ((window as any).difyChatbotConfig) {
        delete (window as any).difyChatbotConfig;
      }
    } catch (error) {
      console.error('Failed to cleanup chatbot:', error);
    }
  }, []);

  return {
    setupChatbot,
    cleanupChatbot,
    isConfigured: !!apiKey,
    user,
  };
}
