const router = require('express').Router();
const { publicStats } = require('../controllers/adminController');

router.get('/', publicStats); // landing-page numbers, no auth
module.exports = router;
