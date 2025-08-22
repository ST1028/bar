import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { CloudUpload, Delete, Image } from '@mui/icons-material';
import { uploadFile } from '../../services/s3Upload';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const ImageUpload = ({ 
  value, 
  onChange, 
  onError, 
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setError(null);

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      const error = `サポートされていないファイル形式です。許可される形式: ${acceptedFormats.join(', ')}`;
      setError(error);
      onError?.(error);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      const error = `ファイルサイズが大きすぎます。最大${maxSizeMB}MBまでです。`;
      setError(error);
      onError?.(error);
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadFile(file, 'category-images');
      onChange(imageUrl);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アップロードに失敗しました';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFormats.join(',')}
        style={{ display: 'none' }}
      />

      {value ? (
        <Card elevation={2} sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 2 },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 },
                width: '100%'
              }}>
                <Box
                  component="img"
                  src={value}
                  alt="プレビュー"
                  sx={{
                    width: { xs: 60, sm: 80 },
                    height: { xs: 60, sm: 80 },
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    // Handle broken image
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{
                      wordBreak: 'break-all',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleRemove}
                  color="error"
                  size="small"
                  disabled={uploading}
                  sx={{
                    flexShrink: 0,
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 }
                  }}
                >
                  <Delete sx={{ fontSize: { xs: 16, sm: 20 } }} />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            border: '2px dashed #e0e0e0',
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            textAlign: 'center',
            bgcolor: 'grey.50',
            cursor: uploading ? 'default' : 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: uploading ? '#e0e0e0' : 'primary.main',
              bgcolor: uploading ? 'grey.50' : 'primary.light',
              '& .MuiTypography-root': {
                color: uploading ? 'text.secondary' : 'primary.main'
              }
            }
          }}
          onClick={uploading ? undefined : handleFileSelect}
        >
          {uploading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={28} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                アップロード中...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Image sx={{ fontSize: { xs: 32, sm: 48 }, color: 'text.secondary' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                画像ファイルをクリックして選択
              </Typography>
              <Typography 
                variant="caption" 
                color="text.disabled"
                sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
              >
                最大{maxSizeMB}MB、JPEG/PNG/WebP/GIF対応
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {!value && (
        <Button
          variant="outlined"
          startIcon={<CloudUpload sx={{ fontSize: { xs: 16, sm: 20 } }} />}
          onClick={handleFileSelect}
          disabled={uploading}
          fullWidth
          sx={{ 
            mt: 1,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 1, sm: 1.5 }
          }}
        >
          ファイルを選択
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ImageUpload;