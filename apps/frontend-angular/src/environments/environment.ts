export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  msalConfig: {
    auth: {
      clientId: 'dca4732b-af7a-47d4-98a6-1ee61168963c', // Same as backend
      authority: 'https://login.microsoftonline.com/3b047bd6-ac58-498b-b7dc-1215824d1b81',
      redirectUri: 'http://localhost:4200/auth/callback',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
};
