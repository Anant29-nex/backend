// routes/posts.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Public: list all
router.get("/all", async (_req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// Public: single post by id
router.get("/public/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch {
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// 🔁 Alias to match frontend that calls /all/:id
router.get("/all/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch {
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Private: current user's posts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(posts);
  } catch {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// Create
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, categories } = req.body;
    const post = new Post({
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      categories: Array.isArray(categories) ? categories : [],
      author: req.user.id,
    });
    await post.save();
    res.status(201).json(post);
  } catch {
    res.status(500).json({ message: "Failed to create post" });
  }
});

// Update
router.put("/:id", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });
  if (post.author.toString() !== req.user.id)
    return res.status(403).json({ message: "Not allowed" });

  Object.assign(post, req.body);
  await post.save();
  res.json(post);
});

// Delete
router.delete("/:id", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });
  if (post.author.toString() !== req.user.id)
    return res.status(403).json({ message: "Not allowed" });

  await post.deleteOne();
  res.json({ message: "Deleted" });
});

module.exports = router;
