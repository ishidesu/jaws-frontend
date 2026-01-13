"use client";

import { useEffect, useState } from 'react';
import { useDifyChatbot } from '../lib/useDifyChatbot';

export default function DifyChatbot() {
  const { setupChatbot, cleanupChatbot, isConfigured } = useDifyChatbot();
  const [chatbotError, setChatbotError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    try {
      setupChatbot();
    } catch (error) {
      console.warn('Chatbot setup failed:', error);
      setChatbotError('Chatbot is temporarily unavailable.');
    }

    // Cleanup on unmount
    return () => {
      if (isConfigured) {
        cleanupChatbot();
      }
    };
  }, [setupChatbot, cleanupChatbot, isConfigured]);

  // Show error message if chatbot fails to load (only in development)
  if (chatbotError && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg text-sm max-w-xs z-50">
        <p className="font-medium">Chatbot Error</p>
        <p className="text-xs mt-1">{chatbotError}</p>
        <button 
          onClick={() => setChatbotError(null)}
          className="absolute top-1 right-1 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    );
  }

  // This component doesn't render anything visible in production
  // The chatbot will be injected by the Dify script if it loads successfully
  return null;
}