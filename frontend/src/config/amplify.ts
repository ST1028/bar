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
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET_NAME || 'bar-file',
      region: import.meta.env.VITE_AWS_REGION || 'ap-northeast-1',
    },
  },
};