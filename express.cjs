const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const app = express();
app.use(cors()); 

// РЕШЕНИЕ ПРОБЛЕМЫ 2: Разрешаем сайту читать файлы из папки uploads
app.use("/uploads", express.static("uploads"));

// РЕШЕНИЕ ПРОБЛЕМЫ 1: Сохраняем оригинальные имена и расширения файлов (.jpg, .mp4)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    // Добавляем цифры ко времени, чтобы файлы с одинаковыми именами не заменяли друг друга
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

const DB_FILE = "db.json";

async function startServer() {
  try {
    console.log("Попытка авторизации бота...");
    await client.start({ botAuthToken: botToken });
    console.log("--- БОТ АВТОРИЗОВАН УСПЕШНО ---");

    // ВОЗВРАЩАЕМ ВЫВОД ФАЙЛОВ ДЛЯ САЙТА (чтобы они рисовались в ленте)
    app.get("/files", (req, res) => {
      try {
        if (!fs.existsSync(DB_FILE)) {
          fs.writeFileSync(DB_FILE, JSON.stringify({ files: [], likes: [], archive: [], settings: {} }));
        }
        const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
        res.json(data);
      } catch (e) {
        res.json({ files: [] });
      }
    });

    // ОБНОВЛЕННАЯ ЗАГРУЗКА
    app.post("/upload", upload.single("file"), async (req, res) => {
      try {
        if (!req.file) {
            return res.status(400).send("Файл не был получен сервером.");
        }

        const filePath = req.file.path;
        
        // 1. Отправляем нормальный файл в Telegram
        await client.sendFile(channelId, { file: filePath });
        
        // ВАЖНО: Мы убрали удаление файла, теперь он останется лежать для сайта!

        // 2. Сохраняем информацию о файле в базу данных сайта (db.json)
        if (!fs.existsSync(DB_FILE)) {
          fs.writeFileSync(DB_FILE, JSON.stringify({ files: [], likes: [], archive: [], settings: {} }));
        }
        const dbData = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
        
        if (!dbData.files) dbData.files = [];
        dbData.files.push(req.file.filename); // Сохраняем имя файла с правильным расширением
        
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData));
        
        res.send("Файл успешно отправлен в канал и появился на сайте!");
      } catch (err) {
        console.error("Ошибка при отправке в ТГ:", err);
        res.status(500).send("Ошибка при загрузке.");
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Сервер KRN SYSTEM запущен на порту ${PORT}`);
    });

  } catch (err) {
    console.error("Ошибка авторизации:", err.message || err);
  }
}

startServer();