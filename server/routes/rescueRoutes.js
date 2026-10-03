const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { STATUSES } = require('../utils/rescueWorkflow');
const c = require('../controllers/rescueController');

const idParam = param('id').isMongoId().withMessage('Invalid rescue id');

router.use(auth);

router.post(
  '/',
  role('user', 'admin'),
  upload.single('image'),
  [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('injuryType').notEmpty().withMessage('Injury type is required'),
    body('severity').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid severity'),
    body('locationName').trim().notEmpty().withMessage('Location is required'),
    body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
  ],
  validate,
  c.createRescue
);
router.get('/stats', c.getStats);
router.get('/', c.listRescues);
router.get('/:id', idParam, validate, c.getRescue);
router.put('/:id', idParam, validate, c.updateRescue);
router.delete('/:id', idParam, validate, c.deleteRescue);
router.patch('/:id/assign', role('volunteer', 'admin'), idParam, validate, c.assignRescue);
router.patch(
  '/:id/status',
  idParam,
  body('status').isIn(STATUSES).withMessage('Invalid status'),
  body('note').optional().isLength({ max: 500 }).withMessage('Note must be under 500 characters'),
  validate,
  c.updateStatus
);

module.exports = router;
