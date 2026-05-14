const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDashboard,
  getGrades,
  getAttendance,
  getProgress,
} = require('../controllers/studentController');

router.use(requireAuth, requireRole('student'));

router.get('/dashboard',    getDashboard);
router.get('/grades',       getGrades);
router.get('/attendance',   getAttendance);
router.get('/progress',     getProgress);

module.exports = router;
