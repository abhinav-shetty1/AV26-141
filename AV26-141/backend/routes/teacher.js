const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDashboard,
  getAllStudents,
  getAtRiskStudents,
  getStudentDetail,
} = require('../controllers/teacherController');

router.use(requireAuth, requireRole('teacher'));

router.get('/dashboard',          getDashboard);
router.get('/students',           getAllStudents);
router.get('/students/at-risk',   getAtRiskStudents);
router.get('/students/:studentId',getStudentDetail);

module.exports = router;
