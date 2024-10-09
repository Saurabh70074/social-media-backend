const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

exports.sendRequest = async (req, res) => {
  const { receiverId } = req.body;

  try {
    const existingRequest = await FriendRequest.findOne({ senderId: req.user.id, receiverId });
    if (existingRequest) return res.status(400).json({ message: 'Friend request already sent' });

    const friendRequest = new FriendRequest({ senderId: req.user.id, receiverId });
    await friendRequest.save();

    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptRequest = async (req, res) => {
  const { requestId } = req.body;

  try {
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest || friendRequest.status !== 'pending') return res.status(404).json({ message: 'Invalid request' });

    friendRequest.status = 'accepted';
    await friendRequest.save();

    await User.updateMany(
      { _id: { $in: [friendRequest.senderId, friendRequest.receiverId] } },
      { $push: { friends: friendRequest.receiverId } }
    );

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
