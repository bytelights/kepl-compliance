export const environment = {
  production: false,
  apiUrl: 'https://kelptest.xyz/api',
  msalConfig: {
    auth: {
      clientId: 'dca4732b-af7a-47d4-98a6-1ee61168963c', // Same as backend
      authority: 'https://login.microsoftonline.com/3b047bd6-ac58-498b-b7dc-1215824d1b81',
      redirectUri: 'https://kelptest.xyz/auth/callback',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
};
