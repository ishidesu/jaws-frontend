const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getAsset = (path: string) => {
    return `${BASE_URL}/library/${path}`;
};