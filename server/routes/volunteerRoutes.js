const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const c = require('../controllers/volunteerController');

const idParam = param('id').isMongoId().withMessage('Invalid volunteer id');
const availability = body('availability').isIn(['available', 'busy', 'offline']).withMessage('Invalid availability');

router.use(auth);
router.post(
  '/',
  role('user', 'volunteer'),
  [body('serviceArea').trim().notEmpty().withMessage('Service area is required'), body('availability').optional().isIn(['available', 'busy', 'offline']).withMessage('Invalid availability')],
  validate,
  c.createVolunteer
);
router.get('/', role('admin'), c.listVolunteers);
router.get('/me', role('volunteer'), c.getMyProfile);
router.get('/:id', idParam, validate, role('volunteer', 'admin'), c.getVolunteer);
router.put('/:id', idParam, validate, role('volunteer', 'admin'), c.updateVolunteer);
router.patch('/:id/availability', idParam, availability, validate, role('volunteer', 'admin'), c.updateAvailability);

module.exports = router;
