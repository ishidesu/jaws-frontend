"use client";

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DifyChatbotManual() {
  const { user } = useAuth();
  const chatbotToken = process.env.NEXT_PUBLIC_DIFY_CHATBOT_TOKEN;

  useEffect(() => {
    if (!chatbotToken) {
      console.warn('Dify chatbot token not configured');
      return;
    }

    // Manual script injection without CSP issues
    const scriptContent = `
      window.difyChatbotConfig = {
        token: '${chatbotToken}',
        inputs: {},
        systemVariables: {
          user_id: '${user?.id || ''}',
        },
        userVariables: {
          name: '${user?.username || ''}',
        },
      };
      
      // Load script dynamically
      (function() {
        var script = document.createElement('script');
        script.src = 'https://udify.app/embed.min.js';
        script.id = '${chatbotToken}';
        script.defer = true;
        script.onerror = function() {
          console.warn('Chatbot script failed to load - this is normal if CORS is blocking it');
        };
        script.onload = function() {
          console.log('Chatbot loaded successfully');
        };
        
        if (!document.getElementById('${chatbotToken}')) {
          document.body.appendChild(script);
        }
      })();
    `;

    // Inject script
    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = scriptContent;
    scriptElement.id = 'dify-chatbot-config';
    
    if (!document.getElementById('dify-chatbot-config')) {
      document.head.appendChild(scriptElement);
    }

    // Add styles
    const style = document.createElement('style');
    style.innerHTML = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
      }
    `;
    style.id = 'dify-chatbot-styles';
    
    if (!document.getElementById('dify-chatbot-styles')) {
      document.head.appendChild(style);
    }

    // Cleanup
    return () => {
      const configScript = document.getElementById('dify-chatbot-config');
      const chatbotScript = document.getElementById(chatbotToken);
      const styles = document.getElementById('dify-chatbot-styles');
      
      if (configScript) configScript.remove();
      if (chatbotScript) chatbotScript.remove();
      if (styles) styles.remove();
    };
  }, [chatbotToken, user]);

  return null;
}