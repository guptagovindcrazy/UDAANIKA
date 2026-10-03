const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const c = require('../controllers/birdController');

const idParam = param('id').isMongoId().withMessage('Invalid bird id');

router.post('/identify', auth, upload.single('image'), c.identify);
router.get('/', c.listBirds);
router.get('/:id', idParam, validate, c.getBird);
router.post('/', auth, role('admin'), body('commonName').trim().notEmpty().withMessage('Common name is required'), validate, c.createBird);
router.put('/:id', auth, role('admin'), idParam, validate, c.updateBird);
router.delete('/:id', auth, role('admin'), idParam, validate, c.deleteBird);

module.exports = router;
