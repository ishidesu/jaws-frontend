"use client";

import { useEffect } from 'react';
import { useDifyChatbot } from '../lib/useDifyChatbot';

export default function DifyChatbot() {
  const { setupChatbot, cleanupChatbot, isConfigured } = useDifyChatbot();

  useEffect(() => {
    if (isConfigured) {
      setupChatbot();
    }

    // Cleanup on unmount
    return () => {
      if (isConfigured) {
        cleanupChatbot();
      }
    };
  }, [setupChatbot, cleanupChatbot, isConfigured]);

  return null;
}