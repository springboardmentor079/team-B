const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pollController = require('../controllers/pollController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

/* ---------- PUBLIC ---------- */
router.get('/', optionalAuth, pollController.getPolls);
router.get('/:id', pollController.getPollById);

/* ---------- AUTH ---------- */
router.use(authenticateToken);

/* ---------- CREATE ---------- */
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 5 }),
    body('description').trim().isLength({ min: 10 }),
    body('options').isArray({ min: 2 }),
    body('targetLocation').trim().notEmpty(),
    body('expiresAt').isISO8601(),
  ],
  pollController.createPoll
);

/* ---------- VOTE ---------- */
router.post('/:id/vote', pollController.voteOnPoll);

/* ---------- OFFICIAL STATUS UPDATE ---------- */
router.patch('/:id/status', pollController.updatePollStatus);
router.delete('/:id', pollController.deletePoll);

/* ❌ Disable until implemented */
// router.get('/:id/my-vote', pollController.getUserVote);
// router.put('/:id', pollController.updatePoll);
// router.get('/:id/stats', pollController.getPollStats);

module.exports = router;
