const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { content } = req.body;

  const post = await Post.create({ user: req.user._id, content });
  res.status(201).json(post);
});

router.post('/:id/comment', auth, async (req, res) => {
  const { content } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) return res.status(404).send('Post not found');

  post.comments.push({ user: req.user._id, content });
  await post.save();

  res.status(201).json(post);
});

// Like Post
router.post('/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send('Post not found');

  if (!post.likes.includes(req.user._id)) {
    post.likes.push(req.user._id);
  } else {
    post.likes = post.likes.filter(userId => userId.toString() !== req.user._id.toString());
  }
  
  await post.save();
  res.json(post);
});

// Get Feed
router.get('/feed', auth, async (req, res) => {
    const user = await User.findById(req.user._id).populate('friends');
    
    const posts = await Post.find({
      $or: [
        { user: { $in: user.friends } },
        { 'comments.user': { $in: user.friends } }
      ]
    }).populate('user comments.user');
    
    res.json(posts);
  });
  

module.exports = router;
