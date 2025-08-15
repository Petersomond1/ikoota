// ikootaapi/middleware/uploadMiddleware.js - UNIFIED VERSION
// Combines existing functionality with enhanced features
// Preserves backward compatibility while adding new capabilities

import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// ===============================================
// AWS S3 CONFIGURATION (Enhanced)
// ===============================================

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ===============================================
// MULTER CONFIGURATION (Preserved + Enhanced)
// ===============================================

// Memory storage for direct S3 upload (same as existing)
const storage = multer.memoryStorage();

// Enhanced file filter with backward compatibility
const fileFilter = (req, file, cb) => {
  console.log('🔍 File filter check:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });

  // PRESERVE EXISTING: Original file type validation
  const originalFiletypes = /jpeg|jpg|png|gif|mp4|mp3|m4a|webm|pdf|txt/;
  const originalExtname = originalFiletypes.test(path.extname(file.originalname).toLowerCase());
  const originalMimetype = originalFiletypes.test(file.mimetype);

  // ENHANCED: Additional supported types for content system
  const enhancedMimeTypes = [
    // Images (existing + new)
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Videos (existing + new)
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
    // Audio (existing + new)
    'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a',
    // Documents (existing + new)
    'application/pdf', 'text/plain', 'text/markdown',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const enhancedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.mp4', '.webm', '.ogg', '.avi', '.mov',
    '.mp3', '.wav', '.m4a', '.txt', '.pdf', '.md', '.doc', '.docx'
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const enhancedMimeValid = enhancedMimeTypes.includes(file.mimetype);
  const enhancedExtValid = enhancedExtensions.includes(fileExtension);

  // Accept file if it passes either original validation OR enhanced validation
  if ((originalMimetype && originalExtname) || (enhancedMimeValid && enhancedExtValid)) {
    console.log('✅ File validation passed:', file.originalname);
    return cb(null, true);
  } else {
    console.log('❌ File validation failed:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension,
      originalValid: originalMimetype && originalExtname,
      enhancedValid: enhancedMimeValid && enhancedExtValid
    });
    
    return cb(new Error('File type not supported! Supported types: images, videos, audio, PDF, text documents'), false);
  }
};

// ===============================================
// MULTER UPLOAD MIDDLEWARE (Preserved Structure)
// ===============================================

// PRESERVE EXISTING: Original upload middleware configuration
export const uploadMiddleware = multer({
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100 MB limit (same as existing)
    files: 3 // Maximum 3 files per request (same as existing)
  },
  fileFilter,
}).fields([
  // PRESERVE EXISTING: Original field structure
  { name: "media1", maxCount: 1 },
  { name: "media2", maxCount: 1 },
  { name: "media3", maxCount: 1 },
  // ENHANCED: Additional fields for content system
  { name: "files", maxCount: 3 }, // For comment uploads
]);

// ===============================================
// S3 UPLOAD MIDDLEWARE (Enhanced + Preserved)
// ===============================================

export const uploadToS3 = async (req, res, next) => {
  try {
    // PRESERVE EXISTING: Skip if no files uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('📝 No files to upload, proceeding...');
      return next();
    }

    console.log('📤 Starting S3 upload process...');
    console.log('🔍 Files received:', Object.keys(req.files));

    // PRESERVE EXISTING: Flatten all files into a single array
    const allFiles = Object.values(req.files).flat();
    
    if (allFiles.length === 0) {
      console.log('📝 No files in request, proceeding...');
      return next();
    }

    console.log(`📤 Uploading ${allFiles.length} files to S3...`);

    // Upload all files to S3
    const uploadPromises = allFiles.map(async (file, index) => {
      try {
        // PRESERVE EXISTING: Generate unique filename with original structure
        const fileExtension = path.extname(file.originalname);
        // ENHANCED: Better organization with content prefix
        const uniqueFilename = `content/${Date.now()}-${uuidv4()}${fileExtension}`;
        
        console.log(`📤 Uploading file ${index + 1}/${allFiles.length}: ${file.originalname} -> ${uniqueFilename}`);

        // PRESERVE EXISTING: Same S3 upload parameters structure
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: uniqueFilename,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read', // PRESERVE EXISTING: Same ACL setting
          // ENHANCED: Additional metadata
          Metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            uploadedBy: req.user?.id?.toString() || 'unknown'
          }
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // PRESERVE EXISTING: Construct the public S3 URL same way
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`;
        
        console.log(`✅ File uploaded successfully: ${fileUrl}`);

        // PRESERVE EXISTING: Return same structure + enhancements
        return { 
          url: fileUrl, 
          type: getFileType(file.mimetype), // PRESERVE EXISTING: Same type detection
          // ENHANCED: Additional metadata
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (uploadError) {
        console.error(`❌ Failed to upload file ${file.originalname}:`, uploadError);
        throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
      }
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      
      console.log(`✅ All files uploaded successfully: ${uploadedFiles.length} files`);
      
      // PRESERVE EXISTING: Attach uploaded files info to request (same structure)
      req.uploadedFiles = uploadedFiles;
      
      // ENHANCED: Also provide additional structure for new features
      req.uploadResults = uploadedFiles;

      next();
    } catch (uploadError) {
      console.error('❌ S3 upload failed:', uploadError);
      // PRESERVE EXISTING: Same error response structure
      return res.status(500).json({
        success: false,
        error: 'File upload failed',
        message: uploadError.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Upload middleware error:', error);
    // PRESERVE EXISTING: Same error response structure
    return res.status(500).json({
      success: false,
      error: 'Upload processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// UTILITY FUNCTIONS (Preserved + Enhanced)
// ===============================================

/**
 * PRESERVE EXISTING: Determine file type based on MIME type (same logic)
 */
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype === 'application/pdf') return 'document';
  if (mimetype.startsWith('text/')) return 'document';
  if (mimetype.includes('document')) return 'document';
  return 'file';
};

/**
 * ENHANCED: Validate S3 configuration
 */
export const validateS3Config = () => {
  const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID', 
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required S3 environment variables:', missingVars);
    return false;
  }

  console.log('✅ S3 configuration validated');
  return true;
};

/**
 * ENHANCED: Error handler for upload errors
 */
export const handleUploadError = (error, req, res, next) => {
  console.error('❌ Upload error:', error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      message: 'File size exceeds 100MB limit',
      maxSize: '100MB'
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: 'Too many files',
      message: 'Maximum 3 files allowed per upload',
      maxFiles: 3
    });
  }

  if (error.message.includes('File type not supported')) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported file type',
      message: error.message
    });
  }

  // Generic upload error
  return res.status(500).json({
    success: false,
    error: 'Upload failed',
    message: error.message || 'An error occurred during file upload'
  });
};

// ===============================================
// BACKWARD COMPATIBILITY EXPORTS
// ===============================================

// PRESERVE EXISTING: Export the same named exports for backward compatibility
// Your existing code using these will continue to work unchanged
export { uploadMiddleware as default };

// ENHANCED: Additional exports for new features
export const contentUploadMiddleware = uploadMiddleware;
export const s3UploadHandler = uploadToS3;

// ===============================================
// INITIALIZATION & LOGGING
// ===============================================

// Validate S3 configuration on module load
if (process.env.NODE_ENV !== 'test') {
  const s3Valid = validateS3Config();
  if (!s3Valid) {
    console.warn('⚠️ S3 upload functionality may not work properly due to missing configuration');
  }
}

console.log('📤 Unified Upload Middleware initialized');
console.log('   ✅ BACKWARD COMPATIBLE: Preserves all existing functionality');
console.log('   ✅ ENHANCED FEATURES: Additional file types and metadata');
console.log('   ✅ File types: images, videos, audio, documents');
console.log('   ✅ File limit: 100MB per file, 3 files per request');
console.log('   ✅ Storage: AWS S3 with public-read ACL');
console.log('   ✅ Error handling: comprehensive validation');
console.log('   ✅ Field names: media1, media2, media3, files (backward compatible)');

// ===============================================
// MIGRATION GUIDE
// ===============================================

/*
MIGRATION GUIDE FOR EXISTING CODE:

1. EXISTING CODE CONTINUES TO WORK:
   - import { uploadMiddleware, uploadToS3 } from './middleware/uploadMiddleware.js';
   - All existing field names (media1, media2, media3) still work
   - Same file type validation (jpeg|jpg|png|gif|mp4|mp3|m4a|webm|pdf|txt)
   - Same response structure (req.uploadedFiles)

2. NEW FEATURES AVAILABLE:
   - Additional file types: webp, ogg, wav, doc, docx, md
   - Enhanced metadata in uploaded file objects
   - New field name: 'files' for bulk uploads
   - Better error messages and validation

3. NO BREAKING CHANGES:
   - File size limits: same (100MB)
   - File count limits: same (3 files)
   - S3 configuration: same environment variables
   - Upload response: same structure with additional optional fields

4. TO USE NEW FEATURES:
   - Use 'files' field name for new uploads
   - Access enhanced metadata in req.uploadedFiles[].originalName, etc.
   - Use new file types if needed

5. RECOMMENDED MIGRATION:
   - Update your existing middleware/upload.middleware.js to use this unified version
   - Test existing functionality to ensure it still works
   - Gradually adopt new features as needed
*/