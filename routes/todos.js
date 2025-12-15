import express from "express";
import PocketBase from "pocketbase";
import pb from "../config/pocketbase.js";

const router = express.Router();

// Middleware to verify authentication
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    pb.authStore.save(token);

    // Verify the token by refreshing auth
    try {
      const authData = await pb.collection("users").authRefresh();
      req.userId = authData.record.id;
      next();
    } catch (err) {
      console.error("Token verification failed:", err);
      pb.authStore.clear();
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
// Get all todos for authenticated user
router.get("/", authenticate, async (req, res) => {
  try {
    const records = await pb.collection("todos").getFullList({
      filter: `user = "${req.userId}"`,
      sort: "-created",
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ message: "Error fetching todos" });
  }
});

// Create a new todo
router.post("/", authenticate, async (req, res) => {
  try {
    const { title } = req.body;

    const record = await pb.collection("todos").create({
      title,
      completed: false,
      user: req.userId,
    });

    res.status(201).json(record);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ message: "Error creating todo" });
  }
});

// Update a todo
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    // Verify ownership
    const todo = await pb.collection("todos").getOne(id);
    if (todo.user !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    const record = await pb.collection("todos").update(id, updateData);

    res.json(record);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ message: "Error updating todo" });
  }
});

// Delete a todo
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const todo = await pb.collection("todos").getOne(id);
    if (todo.user !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await pb.collection("todos").delete(id);

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ message: "Error deleting todo" });
  }
});

export default router;
