// routes/urlRoutes.js
const express = require('express');
const router = express.Router();
const Url = require('../models/Url');
const { nanoid } = require('nanoid');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

router.post('/shorten', async (req, res) => {
  const { longUrl } = req.body;

  console.log('Received URL shortening request:', { longUrl });

  // Validate URL format
  try {
    new URL(longUrl);
  } catch (err) {
    console.log('Invalid URL format:', longUrl);
    return res.status(400).json({ error: 'Invalid URL format. Please include http:// or https://' });
  }

  // Check if URL already exists
  try {
    const existingUrl = await Url.findOne({ longUrl });
    if (existingUrl) {
      console.log('URL already exists in database:', existingUrl.shortCode);
      return res.json({ 
        shortUrl: `${BASE_URL}/${existingUrl.shortCode}`,
        message: 'URL already shortened'
      });
    }

    const shortCode = nanoid(6); // e.g., abc123
    console.log('Generated short code:', shortCode);

    const newUrl = new Url({ longUrl, shortCode });
    await newUrl.save();
    console.log('URL saved to database successfully');

    res.json({ shortUrl: `${BASE_URL}/${shortCode}` });
  } catch (err) {
    console.error('Error in URL shortening:', err);
    if (err.code === 11000) {
      // Handle duplicate shortCode (extremely rare with nanoid but possible)
      console.log('Duplicate short code detected, retrying...');
      return res.status(500).json({ error: 'Failed to generate unique short code. Please try again.' });
    }
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});



const authMiddleware = require('../middleware/auth');

router.get('/admin', authMiddleware, async (req, res) => {
  const urls = await Url.find().sort({ _id: -1 });
  res.json(urls);
});



module.exports = router;
