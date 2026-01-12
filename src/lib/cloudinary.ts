import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Hàm upload file lên Cloudinary
 * @param fileBuffer - Buffer của file cần upload
 * @param fileName - Tên file (không bao gồm đuôi mở rộng)
 * @returns Promise chứa thông tin file đã upload (UploadApiResponse)
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  fileName: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "nextjs_uploads", // Tên thư mục trên Cloudinary
        public_id: fileName,
        resource_type: "auto", // Tự động nhận diện (ảnh/video/raw)
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) {
          reject(error);
          return;
        }
        if (result) {
          resolve(result);
        } else {
          // Trường hợp hiếm gặp: không có lỗi nhưng cũng không có kết quả
          reject(new Error("Upload completed but no result returned"));
        }
      }
    );

    // Ghi buffer vào stream để bắt đầu upload
    uploadStream.end(fileBuffer);
  });
};
