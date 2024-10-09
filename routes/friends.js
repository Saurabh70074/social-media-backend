const express = require('express');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Send Friend Request
router.post('/request', auth, async (req, res) => {
  const { receiverId } = req.body;

  const existingRequest = await FriendRequest.findOne({
    sender: req.user._id,
    receiver: receiverId,
  });

  if (existingRequest) return res.status(400).send('Request already sent');

  const friendRequest = await FriendRequest.create({
    sender: req.user._id,
    receiver: receiverId,
  });

  res.status(201).json(friendRequest);
});

// Accept Friend Request
router.post('/accept/:id', auth, async (req, res) => {
  const request = await FriendRequest.findById(req.params.id);

  if (!request || request.receiver.toString() !== req.user._id.toString()) {
    return res.status(404).send('Request not found');
  }

  request.status = 'accepted';
  await request.save();

  await User.findByIdAndUpdate(req.user._id, { $push: { friends: request.sender } });
  await User.findByIdAndUpdate(request.sender, { $push: { friends: req.user._id } });

  res.json(request);
});

// Reject Friend Request
router.post('/reject/:id', auth, async (req, res) => {
  const request = await FriendRequest.findById(req.params.id);

  if (!request || request.receiver.toString() !== req.user._id.toString()) {
    return res.status(404).send('Request not found');
  }

  await request.remove();
  res.send('Request rejected');
});

module.exports = router;
