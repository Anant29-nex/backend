const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Middleware to authenticate token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid token" });
  }
};

router.get("/all", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

router.get("/public/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({
      title,
      content,
      author: req.user.id, // get from JWT
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post" });
  }
});

router.put("/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });
  if (post.author.toString() !== req.user.id)
    return res.status(403).json({ message: "Not allowed" });

  Object.assign(post, req.body);
  await post.save();
  res.json(post);
});

router.delete("/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });
  if (post.author.toString() !== req.user.id)
    return res.status(403).json({ message: "Not allowed" });

  await post.deleteOne();
  res.json({ message: "Deleted" });
});

module.exports = router;
