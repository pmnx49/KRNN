const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.resolve(__dirname, 'uploads');
const likesFile = path.resolve(__dirname, 'likes.json');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(likesFile)) fs.writeFileSync(likesFile, JSON.stringify([]));

app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage: storage });

app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json([]);
        const sorted = files.sort((a, b) => b.split('-')[0] - a.split('-')[0]);
        const likes = JSON.parse(fs.readFileSync(likesFile));
        res.json({ files: sorted, likes: likes });
    });
});

app.post('/toggle-like', (req, res) => {
    const { fileName } = req.body;
    let likes = JSON.parse(fs.readFileSync(likesFile));
    if (likes.includes(fileName)) {
        likes = likes.filter(f => f !== fileName);
    } else {
        likes.push(fileName);
    }
    fs.writeFileSync(likesFile, JSON.stringify(likes));
    res.json(likes);
});

app.post('/upload', upload.array('files', 20), (req, res) => res.json({ success: true }));

app.delete('/delete/:name', (req, res) => {
    const filePath = path.join(uploadDir, req.params.name);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        let likes = JSON.parse(fs.readFileSync(likesFile));
        fs.writeFileSync(likesFile, JSON.stringify(likes.filter(f => f !== req.params.name)));
        res.json({ message: 'OK' });
    } else { res.status(404).send('Error'); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});