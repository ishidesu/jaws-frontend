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

export const getBasicAuthHeaders = () => {
  const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME!;
  const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD!;
  const credentials = btoa(`${username}:${password}`);
  
  return {
    'Authorization': `Basic ${credentials}`
  };
};

export const transformImageUrl = (imageUrl: string | null): string | null => {
  if (!imageUrl) return null;
  
  if (imageUrl.includes('localhost:8000') || imageUrl.includes('localhost:5350')) {
    return imageUrl.replace(/http:\/\/localhost:\d+/, config.BACKEND_URL);
  }
  
  return imageUrl;
};

