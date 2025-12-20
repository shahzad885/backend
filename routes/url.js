import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Helper function to generate random 6-character code
const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8);
};

// POST /api/urls/shorten - Create a short URL
router.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: "Original URL is required" });
    }

    const shortCode = generateShortCode();

    const { data, error } = await supabase
      .from("urls")
      .insert([
        { original_url: originalUrl, short_code: shortCode }
      ])
      .select();

    if (error) throw error;

    // Return the full shortened URL (assuming port 5000 is your entry point)
    // In production, you would use your domain name here
    const shortUrl = `http://${req.get('host')}/api/urls/${shortCode}`;

    res.status(201).json({
      message: "URL shortened successfully",
      original_url: originalUrl,
      short_code: shortCode,
      short_url: shortUrl
    });

  } catch (error) {
    console.error("Error creating URL:", error);
    res.status(500).json({ message: "Server Error", details: error.message });
  }
});

// GET /api/urls/:code - Redirect to original URL
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // 1. Get the URL from Supabase
    const { data, error } = await supabase
      .from("urls")
      .select("original_url, clicks")
      .eq("short_code", code)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "URL not found" });
    }

    // 2. Increment click count asynchronously (don't wait for it to redirect)
    supabase.rpc('increment_clicks', { url_code: code }).catch(err => {
        // Fallback if RPC doesn't exist: simple update
        supabase.from("urls")
        .update({ clicks: data.clicks + 1 })
        .eq("short_code", code)
        .then();
    });

    // 3. Redirect the user
    res.redirect(data.original_url);

  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/urls/stats - Get top visited URLs (Good for DevOps Load Testing)
router.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("urls")
        .select("*")
        .order('clicks', { ascending: false })
        .limit(10);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

export default router;