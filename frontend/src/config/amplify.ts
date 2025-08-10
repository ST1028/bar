export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      signUpVerificationMethod: 'code' as const,
    },
  },
  API: {
    REST: {
      BarAPI: {
        endpoint: import.meta.env.VITE_API_GATEWAY_URL,
        region: 'us-east-1',
      },
    },
  },
};