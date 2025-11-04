const multer = require('multer');
const { BadRequestError } = require('../../../core/errors/AppError');

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

// File filter - only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Avatar upload middleware
const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: imageFilter
}).single('avatar');

// Cover image upload middleware
const uploadCover = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: imageFilter
}).single('cover');

// Error handling wrapper
const handleMulterError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('File too large. Maximum size is 5MB for avatars, 10MB for covers'));
        }
        return next(new BadRequestError(err.message));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadAvatar: handleMulterError(uploadAvatar),
  uploadCover: handleMulterError(uploadCover),
};

