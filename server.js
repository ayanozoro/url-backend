const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const requiredEnvVars = ['MONGO_URI', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Environment variable ${varName} is not set.`);
    process.exit(1);
  }
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// API routes
app.use('/api', require('./routes/urlRoutes'));

// Short URL redirection route (should be at root level)
const Url = require('./models/Url');
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  console.log('Short code request received:', shortCode);

  try {
    const url = await Url.findOne({ shortCode });
    console.log('Database lookup result:', url);

    if (url) {
      console.log('URL found, redirecting to:', url.longUrl);
      url.visitCount++;
      await url.save();
      return res.redirect(url.longUrl);
    } else {
      console.log('Short URL not found in database');
      return res.status(404).send('Short URL not found');
    }
  } catch (err) {
    console.error('Error in short code redirection:', err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
