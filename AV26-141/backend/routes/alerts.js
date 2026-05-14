const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAllAlerts,
  getUnreviewed,
  createAlert,
  reviewAlert,
} = require('../controllers/alertController');

router.use(requireAuth, requireRole('teacher'));

router.get('/',              getAllAlerts);
router.get('/unreviewed',    getUnreviewed);
router.post('/',             createAlert);
router.patch('/:id/review',  reviewAlert);

module.exports = router;
