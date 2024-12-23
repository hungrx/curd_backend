import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/restaurant-logos/';

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      `restaurant-logo-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// Middleware function to handle optional file upload
export const uploadRestaurantLogo = (req, res, next) => {
  // Use multer's single upload, but make it optional
  upload.single('logo')(req, res, (err) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: 'File upload error', error: err.message });
    } else if (err) {
      return res
        .status(400)
        .json({ message: 'File upload error', error: err.message });
    }

    // Continue to next middleware/route handler
    next();
  });
};


