const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. НАСТРОЙКА CLOUDINARY (Вставь свои данные здесь)
cloudinary.config({
  cloud_name: 'ds3lsnurw',
  api_key: '652628137193142',
  api_secret: 'fRSkx4S9i7fPIHve9m5mQDLT0UU'
});

// 2. НАСТРОЙКА ХРАНИЛИЩА
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'krn_system', // папка в облаке
    resource_type: 'auto', // автоматически определять (видео, фото или аудио)
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2000 * 1024 * 1024 } // Лимит 2 ГБ
});

// Файлы для настроек, лайков и архива
const settingsFile = path.resolve(__dirname, 'settings.json');
const likesFile = path.resolve(__dirname, 'likes.json');
const archiveFile = path.resolve(__dirname, 'archive.json');

// Инициализация файлов, если их нет
if (!fs.existsSync(settingsFile)) fs.writeFileSync(settingsFile, JSON.stringify({}));
if (!fs.existsSync(likesFile)) fs.writeFileSync(likesFile, JSON.stringify([]));
if (!fs.existsSync(archiveFile)) fs.writeFileSync(archiveFile, JSON.stringify([]));

// 3. ПУТЬ ДЛЯ ЗАГРУЗКИ
app.post('/upload', upload.array('files'), (req, res) => {
  // Возвращаем ссылки на загруженные файлы в облаке
  const urls = req.files.map(file => file.path);
  res.json(urls);
});

// ПУТЬ ДЛЯ ПОЛУЧЕНИЯ ВСЕХ ФАЙЛОВ
app.get('/files', async (req, res) => {
  try {
    const likes = JSON.parse(fs.readFileSync(likesFile));
    const archive = JSON.parse(fs.readFileSync(archiveFile));
    const settings = JSON.parse(fs.readFileSync(settingsFile));
    
    // Получаем список файлов напрямую из Cloudinary
    const result = await cloudinary.api.resources({ 
      type: 'upload', 
      prefix: 'krn_system/',
      max_results: 500 
    });
    
    // Преобразуем формат для фронтенда
    const files = result.resources.map(r => r.secure_url);
    
    res.json({ files, likes, archive, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ПУТЬ ДЛЯ ОБНОВЛЕНИЯ НАСТРОЕК (Пароли, обои)
app.post('/update-settings', (req, res) => {
  fs.writeFileSync(settingsFile, JSON.stringify(req.body));
  res.json({ status: 'ok' });
});

// ЛАЙКИ И АРХИВ
app.post('/toggle-like', (req, res) => {
  let likes = JSON.parse(fs.readFileSync(likesFile));
  const file = req.body.fileName;
  likes = likes.includes(file) ? likes.filter(f => f !== file) : [...likes, file];
  fs.writeFileSync(likesFile, JSON.stringify(likes));
  res.json(likes);
});

app.post('/toggle-archive', (req, res) => {
  let arc = JSON.parse(fs.readFileSync(archiveFile));
  const file = req.body.fileName;
  arc = arc.includes(file) ? arc.filter(f => f !== file) : [...arc, file];
  fs.writeFileSync(archiveFile, JSON.stringify(arc));
  res.json(arc);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));