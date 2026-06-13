const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadMaterial, generateSummary, generateQuiz, getClassMaterials, getMaterialById } = require('../controllers/materialsController');

// Multer config — where to store uploaded files and what to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // store in uploads/ folder
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    cb(null, uniqueName);
  }
});

// Only accept PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

router.use(authenticate);

router.get('/class/:classId', getClassMaterials);
router.get('/:id', getMaterialById);
router.post('/upload', authorize('teacher'), upload.single('pdf'), uploadMaterial);
router.post('/:id/generate-summary', generateSummary);
router.post('/:id/generate-quiz', generateQuiz);

module.exports = router;
