const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const c = require('../controllers/migrationController');

const idParam = param('id').isMongoId().withMessage('Invalid observation id');

router.post(
  '/',
  auth,
  upload.single('image'),
  [
    body('species').trim().notEmpty().withMessage('Species is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('observationDate').isISO8601().withMessage('Valid observation date is required'),
    body('count').optional().isInt({ min: 1 }).withMessage('Count must be at least 1'),
    body('latitude').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('direction').optional({ values: 'falsy' }).isIn(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']).withMessage('Invalid direction'),
  ],
  validate,
  c.createObservation
);
router.get('/', c.listObservations);
router.get('/analytics', c.analytics);
router.get('/:id', idParam, validate, c.getObservation);
router.delete('/:id', auth, idParam, validate, c.deleteObservation);

module.exports = router;
