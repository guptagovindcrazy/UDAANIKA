const router = require('express').Router();
const { param } = require('express-validator');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const admin = require('../controllers/adminController');
const { listVolunteers } = require('../controllers/volunteerController');
const { listRescues } = require('../controllers/rescueController');

router.use(auth, role('admin'));
router.get('/dashboard', admin.dashboard);
router.get('/users', admin.listUsers);
router.delete('/users/:id', param('id').isMongoId().withMessage('Invalid user id'), validate, admin.deleteUser);
router.get('/volunteers', listVolunteers);
router.get('/rescues', listRescues); // admins see every rescue

module.exports = router;
