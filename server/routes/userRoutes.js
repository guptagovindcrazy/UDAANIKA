const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { getProfile, updateProfile } = require('../controllers/userController');

router.use(auth);
router.get('/profile', getProfile);
router.put(
  '/profile',
  upload.single('profileImage'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('newPassword').optional().isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  updateProfile
);

module.exports = router;
