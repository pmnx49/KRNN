const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const app = express();

// Разрешаем запросы со всех сайтов (чтобы твой Vercel мог отправлять сюда фото)
app.use(cors()); 

const upload = multer({ dest: "uploads/" });

// Берем секретные данные из "окружения" хостинга
const apiId = Number(process.env.TELEGRAM_API_ID); 
const apiHash = process.env.TELEGRAM_API_HASH;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const stringSession = new StringSession("");

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

async function startServer() {
  try {
    console.log("Попытка авторизации бота...");
    
    await client.start({ botAuthToken: botToken });
    console.log("--- БОТ АВТОРИЗОВАН УСПЕШНО ---");

    app.post("/upload", upload.single("file"), async (req, res) => {
      try {
        if (!req.file) {
            return res.status(400).send("Файл не был получен сервером.");
        }

        const filePath = req.file.path;
        
        await client.sendFile(channelId, { file: filePath });
        fs.unlinkSync(filePath); 
        
        res.send("Файл успешно отправлен в канал!");
      } catch (err) {
        console.error("Ошибка при отправке в ТГ:", err);
        res.status(500).send("Ошибка при загрузке в облако.");
      }
    });

    // Для облачных хостингов обязательно нужен динамический порт
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Сервер KRN SYSTEM запущен на порту ${PORT}`);
    });

  } catch (err) {
    console.error("Ошибка авторизации:", err.message || err);
  }
}

startServer();