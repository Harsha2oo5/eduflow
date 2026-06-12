const express = require('express');
const router = express.Router();
const { createClass, getMyClasses, joinClass, getClassById } = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

// All class routes require login
router.use(authenticate);

router.get('/', getMyClasses);
router.get('/:id', getClassById);
router.post('/', authorize('teacher'), createClass);      // only teachers can create
router.post('/join', authorize('student'), joinClass);    // only students can join

module.exports = router;
