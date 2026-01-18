"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Global state to prevent multiple initializations across component remounts
let globalChatbotInitialized = false;
let globalScriptLoaded = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export default function DifyChatbotManual() {
  const { user } = useAuth();
  const chatbotToken = process.env.NEXT_PUBLIC_DIFY_CHATBOT_TOKEN;
  const initAttempted = useRef(false);
  const [buttonStatus, setButtonStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!chatbotToken) {
      console.warn('[Dify] Chatbot token not configured');
      setButtonStatus('error');
      return;
    }

    // Prevent double initialization in React Strict Mode
    if (initAttempted.current) {
      console.log('[Dify] Init already attempted in this component instance');
      return;
    }

    initAttempted.current = true;

    const checkButtonExists = (): boolean => {
      const button = document.getElementById('dify-chatbot-bubble-button');
      return button !== null;
    };

    const waitForButton = (maxWaitTime: number = 5000): Promise<boolean> => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
          if (checkButtonExists()) {
            clearInterval(checkInterval);
            console.log('[Dify] Button found! ✓');
            setButtonStatus('ready');
            resolve(true);
          } else if (Date.now() - startTime > maxWaitTime) {
            clearInterval(checkInterval);
            console.warn('[Dify] Button not found after waiting');
            resolve(false);
          }
        }, 200);
      });
    };

    const retryInit = async () => {
      if (retryCount >= MAX_RETRIES) {
        console.error('[Dify] Max retries reached. Chatbot may not be available.');
        setButtonStatus('error');
        return;
      }

      retryCount++;
      console.log(`[Dify] Retry attempt ${retryCount}/${MAX_RETRIES}`);
      
      // Remove existing script and try again
      const existingScript = document.getElementById('dify-chatbot-script');
      if (existingScript) {
        existingScript.remove();
        globalScriptLoaded = false;
        globalChatbotInitialized = false;
      }

      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      initChatbot();
    };

    const initChatbot = async () => {
      console.log('[Dify] Initializing chatbot...');
      console.log('[Dify] Global state - initialized:', globalChatbotInitialized, 'script loaded:', globalScriptLoaded);

      // Always update config with latest user data BEFORE loading script
      (window as any).difyChatbotConfig = {
        token: chatbotToken,
        inputs: {},
        systemVariables: {
          user_id: user?.id || '',
        },
        userVariables: {
          name: user?.username || 'Guest',
        },
      };

      console.log('[Dify] Config updated for user:', user?.username || 'Guest');

      // Check if button already exists (from previous load)
      if (checkButtonExists()) {
        console.log('[Dify] Button already exists, skipping init');
        setButtonStatus('ready');
        return;
      }

      // Check if script already exists
      const existingScript = document.getElementById('dify-chatbot-script');
      
      if (existingScript && globalScriptLoaded) {
        console.log('[Dify] Script already loaded, waiting for button...');
        const buttonFound = await waitForButton(3000);
        
        if (!buttonFound) {
          console.warn('[Dify] Script loaded but button missing - attempting retry');
          await retryInit();
        }
        return;
      }

      // Load script if not already loaded
      if (!existingScript) {
        console.log('[Dify] Loading script...');
        
        const script = document.createElement('script');
        script.src = 'https://udify.app/embed.min.js';
        script.id = 'dify-chatbot-script';
        script.defer = true;
        
        script.onload = async () => {
          console.log('[Dify] Script loaded successfully');
          globalScriptLoaded = true;
          globalChatbotInitialized = true;
          
          // Wait for button to appear
          const buttonFound = await waitForButton(5000);
          
          if (!buttonFound) {
            console.error('[Dify] Button not created - possible issues:');
            console.error('  1. Token is invalid or expired');
            console.error('  2. Dify service is down');
            console.error('  3. Network/CORS issue');
            console.error('  Current token:', chatbotToken);
            
            // Attempt retry
            await retryInit();
          }
        };
        
        script.onerror = async () => {
          console.error('[Dify] Failed to load script from udify.app');
          globalScriptLoaded = false;
          globalChatbotInitialized = false;
          setButtonStatus('error');
          
          // Attempt retry
          await retryInit();
        };
        
        document.body.appendChild(script);
      }

      // Add styles if not exists
      if (!document.getElementById('dify-chatbot-styles')) {
        const style = document.createElement('style');
        style.id = 'dify-chatbot-styles';
        style.innerHTML = `
          #dify-chatbot-bubble-button {
            background-color: #1C64F2 !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
            z-index: 9999 !important;
          }
          #dify-chatbot-bubble-button:hover {
            background-color: #1557d8 !important;
          }
          #dify-chatbot-bubble-window {
            width: 24rem !important;
            height: 40rem !important;
            max-height: 90vh !important;
            z-index: 9999 !important;
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
        console.log('[Dify] Styles added');
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(initChatbot, 100);

    // Periodic check (every 10 seconds) to ensure chatbot stays visible
    const checkInterval = setInterval(() => {
      const button = document.getElementById('dify-chatbot-bubble-button');
      const script = document.getElementById('dify-chatbot-script');
      
      if (script && !button && globalScriptLoaded && buttonStatus !== 'ready') {
        console.warn('[Dify] Periodic check: Script exists but button missing');
        // Don't retry here, let the initial load handle retries
      } else if (button && buttonStatus !== 'ready') {
        console.log('[Dify] Periodic check: Button found!');
        setButtonStatus('ready');
      }
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(checkInterval);
    };
  }, [chatbotToken, user?.id, user?.username, buttonStatus]);

  // Optional: Show loading indicator (can be removed if not needed)
  return null;
}
