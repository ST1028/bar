import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';

/**
 * Upload a file using API Gateway (fallback for when Amplify Storage is not configured)
 * @param file - The file to upload
 * @param folder - The folder path in S3 (optional)
 * @returns Promise<string> - The public URL of the uploaded file
 */
export const uploadFileViaAPI = async (file: File, folder?: string): Promise<string> => {
  try {
    console.log('🔄 Starting API-based file upload:', { fileName: file.name, size: file.size });
    
    // Get auth session for API call
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) {
      throw new Error('認証トークンが見つかりません。ログインし直してください。');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    // Upload via API Gateway
    const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;
    const response = await axios.post(`${API_BASE_URL}/admin/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${session.tokens.idToken.toString()}`
      }
    });

    console.log('✅ API upload successful:', response.data);
    return response.data.imageUrl;
  } catch (error) {
    console.error('❌ API upload failed:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('認証が無効です。ログインし直してください。');
      }
      if (error.response?.status === 413) {
        throw new Error('ファイルサイズが大きすぎます。');
      }
      throw new Error(error.response?.data?.message || 'アップロードに失敗しました');
    }
    
    throw new Error(error instanceof Error ? error.message : 'ファイルのアップロードに失敗しました');
  }
};

/**
 * Compress and convert file to base64 (fallback option)
 * @param file - The file to convert
 * @param maxWidth - Maximum width for compression (default: 800)
 * @param maxHeight - Maximum height for compression (default: 600)
 * @param quality - JPEG quality (0-1, default: 0.7)
 * @returns Promise<string> - Compressed base64 data URL
 */
export const fileToBase64 = (
  file: File, 
  maxWidth: number = 800, 
  maxHeight: number = 600, 
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      console.log('🗜️ Image compression:', {
        originalSize: `${(file.size / 1024).toFixed(1)}KB`,
        compressedSize: `${(compressedBase64.length * 0.75 / 1024).toFixed(1)}KB`, // Rough estimate
        dimensions: `${width}x${height}`,
        compressionRatio: ((file.size / (compressedBase64.length * 0.75)) * 100).toFixed(1) + '%'
      });
      
      resolve(compressedBase64);
    };
    
    img.onerror = reject;
    
    // Create object URL for the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Upload a file to S3 - tries API first, falls back to base64
 * @param file - The file to upload
 * @param folder - The folder path in S3 (optional)
 * @returns Promise<string> - The public URL of the uploaded file
 */
export const uploadFile = async (file: File, folder?: string): Promise<string> => {
  try {
    // Try API-based upload first
    console.log('🔄 Attempting API upload...');
    return await uploadFileViaAPI(file, folder);
  } catch (error) {
    console.warn('⚠️ API upload failed, falling back to base64:', error);
    
    // Fallback to base64 encoding for temporary solution
    // Note: This is not ideal for production as it creates very long URLs
    try {
      const base64 = await fileToBase64(file);
      console.log('✅ Converted file to base64 (fallback)');
      return base64;
    } catch (base64Error) {
      console.error('❌ Base64 conversion failed:', base64Error);
      throw new Error('ファイルの処理に失敗しました。');
    }
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