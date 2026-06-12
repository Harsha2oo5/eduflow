const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { markAttendance, getAttendance, getStudentAttendance } = require('../controllers/attendanceController');

router.use(authenticate);

router.post('/', authorize('teacher'), markAttendance);
router.get('/:classId', getAttendance);
router.get('/student/:studentId/class/:classId', getStudentAttendance);

module.exports = router;
