import { supabase } from './supabase';

export const config = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL!,
  
  API_ENDPOINTS: {
    UPLOAD_IMAGE: '/upload-image',
    UPDATE_PRODUCT: '/update-product',
    DELETE_PRODUCT: '/delete-product',
    DELETE_IMAGE: '/delete-image',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${config.BACKEND_URL}${endpoint}`;
};

/**
 * Get JWT token from current Supabase session
 * @deprecated Use getJWTAuthHeaders instead
 */
export const getBasicAuthHeaders = () => {
  const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME!;
  const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD!;
  const credentials = btoa(`${username}:${password}`);
  
  return {
    'Authorization': `Basic ${credentials}`
  };
};

/**
 * Get JWT Bearer token from Supabase session for backend API calls
 */
export const getJWTAuthHeaders = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('No active session');
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`
    };
  } catch (error) {
    console.error('Failed to get JWT token:', error);
    throw new Error('Authentication required');
  }
};

export const transformImageUrl = (imageUrl: string | null): string | null => {
  if (!imageUrl) return null;
  
  if (imageUrl.includes('localhost:8000') || imageUrl.includes('localhost:5350')) {
    return imageUrl.replace(/http:\/\/localhost:\d+/, config.BACKEND_URL);
  }
  
  return imageUrl;
};