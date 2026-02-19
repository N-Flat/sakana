import { apiClient } from './api';

export interface UploadImage {
  image_url: string;
  filename: string;
}

export const imageService = {
  /**
   * 画像アップロード
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/api/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.image_url;
  },

  /**
   * 画像削除
   */
  async deleteImage(imagePath: string): Promise<void> {
    await apiClient.delete('/api/delete-image', {
      data: { image_path: imagePath },
    });
  },
}