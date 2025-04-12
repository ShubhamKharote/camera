const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const db = require('../db');
const { spawn } = require('child_process');

// POST - Upload photo
router.post('/', async (req, res) => {
  const { photoData } = req.body;
  if (!photoData) return res.status(400).json({ error: 'No photo data provided' });

  try {
    const imageBuffer = Buffer.from(photoData.split(',')[1], 'base64');

    // INSERT if not exists, otherwise UPDATE
    await db.query(
      `INSERT INTO "user" (id, name, photo)
       VALUES ($1, 'shubham', $2)
       ON CONFLICT (id) DO UPDATE SET photo = EXCLUDED.photo`,
      [1, imageBuffer]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false });
  }
});

// GET - Download and save photo
router.get('/download', async (req, res) => {
  try {
    const result = await db.query('SELECT photo FROM "user" WHERE id = $1', [1]);
    const photo = result.rows[0]?.photo;

    if (!photo) {
      return res.status(404).json({ error: 'No photo found' });
    }

    const baseName = 'user_photo';
    const ext = '.png';
    const downloadsDir = path.join(__dirname, '../downloads');
    let fileName = `${baseName}${ext}`;
    let counter = 1;

    // Find a non-existing filename
    while (fs.existsSync(path.join(downloadsDir, fileName))) {
      fileName = `${baseName}_${counter}${ext}`;
      counter++;
    }

    const outputPath = path.join(downloadsDir, fileName);
    fs.writeFileSync(outputPath, photo);

    res.json({ success: true, message: `Photo saved to server/downloads/${fileName}` });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false });
  }
});

// POST - Recognize face using Python script
router.post('/recognize', async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    const process = spawn('python', ['../recognize_face.py', image]);
    let data = '';

    process.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    process.stderr.on('data', (err) => {
      console.error('Recognition error:', err.toString());
    });

    process.on('close', (code) => {
      try {
        const result = JSON.parse(data);
        res.json(result);
      } catch (e) {
        console.error('Failed to parse recognition result:', e);
        res.status(500).json({ recognized: false });
      }
    });
  } catch (err) {
    console.error('Python face recognition error:', err);
    res.status(500).json({ recognized: false });
  }
});

module.exports = router;
