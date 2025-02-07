const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const { convertAudioToText } = require('../utils/audioUtils');
const { storeEmbeddings } = require('../utils/dbUtils');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/process_audio', upload.single('file'), async (req, res) => {
    const audioFilePath = req.file.path;

    // Convert audio to text
    const text = await convertAudioToText(audioFilePath);

    // Generate embeddings using OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddings = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
    });

    // Store embeddings in your vector database
    await storeEmbeddings(embeddings.data);

    res.json({ message: 'Audio processed successfully', embeddings });
});

module.exports = router;
