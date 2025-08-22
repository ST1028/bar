import { uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Upload a file to S3 using AWS Amplify Storage
 * @param file - The file to upload
 * @param folder - The folder path in S3 (optional)
 * @returns Promise<string> - The public URL of the uploaded file
 */
export const uploadFile = async (file: File, folder?: string): Promise<string> => {
  try {
    // Ensure we have valid credentials before attempting upload
    console.log('🔐 Checking authentication session for S3 upload...');
    const session = await fetchAuthSession();
    console.log('📋 Session status:', {
      hasCredentials: !!session.credentials,
      hasIdentityId: !!session.identityId,
      hasTokens: !!session.tokens
    });

    if (!session.credentials) {
      throw new Error('認証情報が見つかりません。ログインし直してください。');
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Construct the full path for public access
    const path = folder ? `${folder}/${fileName}` : fileName;
    
    console.log('🔄 Starting S3 upload:', { fileName, path, size: file.size });
    
    // Upload to S3 using Amplify Storage
    const result = await uploadData({
      path,
      data: file,
      options: {
        contentType: file.type
      }
    }).result;
    
    console.log('✅ S3 upload successful:', result);
    
    // Construct the public URL
    // The format depends on your Amplify Storage configuration
    // This assumes the standard format: https://bucket-name.s3.region.amazonaws.com/public/path
    const bucketName = import.meta.env.VITE_S3_BUCKET_NAME || 'bar-file';
    const region = import.meta.env.VITE_AWS_REGION || 'ap-northeast-1';
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/public/${path}`;
    
    console.log('📎 Generated public URL:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Credentials')) {
        throw new Error('認証情報が無効です。ログインし直してください。');
      }
      if (error.message.includes('Access Denied')) {
        throw new Error('S3へのアクセス権限がありません。管理者にお問い合わせください。');
      }
      throw new Error(error.message);
    }
    
    throw new Error('ファイルのアップロードに失敗しました');
  }
};

/**
 * Generate a unique filename for uploads
 * @param originalName - The original filename
 * @returns string - A unique filename
 */
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const fileExtension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${fileExtension}`;
};

/**
 * Validate file before upload
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Array of allowed MIME types
 * @returns boolean - true if valid, throws error if invalid
 */
export const validateFile = (
  file: File, 
  maxSizeMB: number = 5, 
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): boolean => {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`サポートされていないファイル形式です。許可される形式: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    throw new Error(`ファイルサイズが大きすぎます。最大${maxSizeMB}MBまでです。`);
  }
  
  return true;
};