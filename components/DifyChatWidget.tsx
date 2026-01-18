"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DifyChatWidget() {
  const { user } = useAuth();
  const chatbotToken = process.env.NEXT_PUBLIC_DIFY_CHATBOT_TOKEN;
  const isInitialized = useRef(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Skip jika tidak ada token
    if (!chatbotToken) {
      console.log('❌ Chatbot token tidak ditemukan');
      return;
    }

    // Prevent double initialization di React Strict Mode
    if (isInitialized.current) {
      console.log('⏭️ Chatbot sudah diinisialisasi, skip');
      return;
    }

    console.log('🤖 Inisialisasi chatbot...');
    isInitialized.current = true;

    // PENTING: Set config SEBELUM load script
    // Ini memastikan config sudah ada saat script dijalankan
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

    console.log('📝 Config set untuk user:', user?.username || 'Guest');

    // Cek apakah script sudah ada (dari load sebelumnya)
    const existingScript = document.getElementById('dify-chatbot-script');
    
    if (existingScript) {
      console.log('✅ Script sudah ada, re-use existing script');
      
      // Script sudah ada, tapi button mungkin hilang karena hydration
      // Tunggu sebentar dan cek button
      setTimeout(() => {
        const button = document.getElementById('dify-chatbot-bubble-button');
        if (!button) {
          console.log('⚠️ Button hilang setelah hydration, reload script...');
          existingScript.remove();
          loadScript();
        } else {
          console.log('✅ Button masih ada');
        }
      }, 500);
      
      return;
    }

    // Load script baru
    loadScript();

    function loadScript() {
      console.log('📦 Loading script...');
      
      const script = document.createElement('script');
      script.id = 'dify-chatbot-script';
      script.src = 'https://udify.app/embed.min.js';
      script.defer = true;
      
      // PENTING: Tambahkan attribute untuk mencegah React menghapusnya
      script.setAttribute('data-dify-chatbot', 'true');
      
      script.onload = () => {
        console.log('✅ Script loaded');
        
        // Tunggu button muncul
        let attempts = 0;
        const maxAttempts = 20; // 20 x 250ms = 5 detik
        
        const checkButton = setInterval(() => {
          attempts++;
          const button = document.getElementById('dify-chatbot-bubble-button');
          
          if (button) {
            console.log('✅ Button chatbot muncul!');
            clearInterval(checkButton);
            
            // Tambahkan attribute untuk protect dari React cleanup
            button.setAttribute('data-dify-widget', 'true');
            
            // Cek juga window element
            const chatWindow = document.getElementById('dify-chatbot-bubble-window');
            if (chatWindow) {
              chatWindow.setAttribute('data-dify-widget', 'true');
            }
          } else if (attempts >= maxAttempts) {
            console.log('⚠️ Button tidak muncul setelah 5 detik');
            console.log('💡 Kemungkinan: Token invalid atau domain belum di-whitelist');
            clearInterval(checkButton);
          }
        }, 250);
      };
      
      script.onerror = () => {
        console.log('❌ Gagal load script dari udify.app');
      };
      
      scriptRef.current = script;
      document.body.appendChild(script);
    }

    // Tambahkan styling
    if (!document.getElementById('dify-chatbot-styles')) {
      const style = document.createElement('style');
      style.id = 'dify-chatbot-styles';
      style.innerHTML = `
        /* Protect chatbot elements dari React cleanup */
        [data-dify-widget] {
          pointer-events: auto !important;
        }
        
        #dify-chatbot-bubble-button {
          background-color: #1C64F2 !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          z-index: 9999 !important;
          position: fixed !important;
          bottom: 1rem !important;
          right: 1rem !important;
        }
        
        #dify-chatbot-bubble-button:hover {
          background-color: #1557d8 !important;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        
        /* Desktop: Window normal size */
        #dify-chatbot-bubble-window {
          width: 24rem !important;
          height: 40rem !important;
          max-height: 90vh !important;
          z-index: 9999 !important;
          position: fixed !important;
          bottom: 5rem !important;
          right: 1rem !important;
          border-radius: 1rem !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
        }
        
        /* Mobile: Window lebih kecil dan tidak fullscreen */
        @media (max-width: 640px) {
          #dify-chatbot-bubble-window {
            width: calc(100vw - 1rem) !important;
            height: 70vh !important;
            max-height: 70vh !important;
            bottom: 4.5rem !important;
            right: 0.5rem !important;
            left: 0.5rem !important;
            margin: 0 auto !important;
            border-radius: 1rem !important;
          }
          
          #dify-chatbot-bubble-button {
            bottom: 1rem !important;
            right: 1rem !important;
            width: 3.5rem !important;
            height: 3.5rem !important;
          }
        }
        
        /* Tablet: Medium size */
        @media (min-width: 641px) and (max-width: 1024px) {
          #dify-chatbot-bubble-window {
            width: 22rem !important;
            height: 35rem !important;
            max-height: 80vh !important;
          }
        }
      `;
      document.head.appendChild(style);
      console.log('🎨 Styling ditambahkan (mobile-friendly)');
    }

    // Cleanup function - MINIMAL cleanup untuk prevent memory leak
    return () => {
      console.log('🧹 Component unmount, tapi keep chatbot alive');
      // JANGAN hapus script atau button
      // Biarkan tetap ada untuk prevent hilang saat navigation
    };
  }, [chatbotToken, user?.id, user?.username]);

  // Render null - chatbot akan di-inject oleh Dify script
  return null;
}
