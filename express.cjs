const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const app = express();
app.use(cors());
app.use(express.json());

// Раздача статики, чтобы сайт мог играть видео и музыку по прямым ссылкам
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Настройка хранения: сохраняем оригинальное имя с расширением
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    // Добавляем метку времени, чтобы файлы с одинаковым названием не перезаписывались
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

const apiId = Number(process.env.TELEGRAM_API_ID); 
const apiHash = process.env.TELEGRAM_API_HASH;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const stringSession = new StringSession("");

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

const getDB = () => {
    if (!fs.existsSync("db.json")) return { files: [] };
    try {
        return JSON.parse(fs.readFileSync("db.json", "utf-8"));
    } catch (e) { return { files: [] }; }
};
const saveDB = (data) => fs.writeFileSync("db.json", JSON.stringify(data, null, 2));

async function startServer() {
  try {
    await client.start({ botAuthToken: botToken });
    console.log("--- KRN SYSTEM SERVER STARTED ---");

    app.get("/files", (req, res) => {
      const db = getDB();
      res.json(db.files);
    });

    app.post("/upload", upload.single("file"), async (req, res) => {
      try {
        if (!req.file) return res.status(400).send("No file.");

        const filePath = req.file.path;
        const fileName = req.file.filename;
        const originalName = req.file.originalname;

        // Отправка в Telegram. Библиотека сама поймет тип файла по расширению (.mp4, .mp3 и т.д.)
        await client.sendFile(channelId, { 
            file: filePath,
            caption: `Загружено через KRN SYSTEM: ${originalName}`
        });

        // Сохраняем в базу для сайта
        const db = getDB();
        const newFile = {
            id: Date.now(),
            name: originalName,
            url: `${req.protocol}://${req.get('host')}/uploads/${fileName}`,
            type: req.file.mimetype, // Сохраняем тип (video/mp4, audio/mpeg и т.д.)
            date: new Date().toISOString()
        };
        db.files.push(newFile);
        saveDB(db);
        
        res.send("Файл успешно загружен!");
      } catch (err) {
        console.error("Upload error:", err);
        res.status(500).send("Server error.");
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Backend link: http://localhost:${PORT}`));

  } catch (err) {
    console.error("Start error:", err);
  }
}

startServer();