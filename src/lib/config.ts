// Address of your Express API.
// Set EXPO_PUBLIC_API_URL in the app's .env file (see instructions).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
