"use client";

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SimpleChatbot() {
  const { user } = useAuth();
  const chatbotToken = process.env.NEXT_PUBLIC_DIFY_CHATBOT_TOKEN;

  useEffect(() => {
    // Jika tidak ada token, skip
    if (!chatbotToken) {
      console.log('❌ Chatbot token tidak ditemukan di .env');
      return;
    }

    console.log('🤖 Memulai chatbot...');
    console.log('📝 Token:', chatbotToken);
    console.log('👤 User:', user?.username || 'Guest');

    // Set konfigurasi chatbot
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

    // Cek apakah script sudah ada
    let script = document.getElementById('dify-chatbot-script') as HTMLScriptElement;
    
    if (!script) {
      // Buat script baru
      script = document.createElement('script');
      script.id = 'dify-chatbot-script';
      script.src = 'https://udify.app/embed.min.js';
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Script chatbot berhasil dimuat');
        
        // Tunggu sebentar untuk button muncul
        setTimeout(() => {
          const button = document.getElementById('dify-chatbot-bubble-button');
          if (button) {
            console.log('✅ Button chatbot ditemukan!');
          } else {
            console.log('⚠️ Button chatbot tidak ditemukan. Cek token Anda.');
          }
        }, 1000);
      };
      
      script.onerror = () => {
        console.log('❌ Gagal memuat script chatbot');
      };
      
      document.body.appendChild(script);
      console.log('📦 Script chatbot ditambahkan ke halaman');
    } else {
      console.log('✅ Script chatbot sudah ada');
    }

    // Tambahkan styling
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
      console.log('🎨 Styling chatbot ditambahkan');
    }

  }, [chatbotToken, user?.id, user?.username]);

  return null;
}
