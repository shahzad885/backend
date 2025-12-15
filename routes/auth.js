import express from "express";
import PocketBase from "pocketbase";
import pb from "../config/pocketbase.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, passwordConfirm, name } = req.body;

    const user = await pb.collection("users").create({
      email,
      password,
      passwordConfirm,
      name,
      emailVisibility: true,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      message: error.message || "Registration failed",
      details: error.data || {},
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);

    res.json({
      token: authData.token,
      user: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      message: "Invalid credentials",
    });
  }
});
// Verify token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    pb.authStore.save(token);

    if (pb.authStore.isValid) {
      res.json({
        valid: true,
        user: pb.authStore.model,
      });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    res.status(401).json({ message: "Token verification failed" });
  }
});

export default router;
