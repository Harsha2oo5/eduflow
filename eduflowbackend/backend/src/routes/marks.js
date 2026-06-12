const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { addMarks, getClassMarks, getMyMarks } = require('../controllers/marksController');

router.use(authenticate);

router.post('/', authorize('teacher'), addMarks);
router.get('/class/:classId', authorize('teacher'), getClassMarks);
router.get('/student/me', authorize('student'), getMyMarks);

module.exports = router;
