const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const app = express();

// 1. Улучшенный CORS: разрешаем запросы с любого адреса (включая твой Vercel)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 2. Раздача статики: теперь файлы будут доступны по прямым ссылкам
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Создаем папку для файлов, если её нет
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Настройка хранения: сохраняем расширение, чтобы ТГ видел медиа, а не "файлы"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Уникальное имя: время + оригинальное имя
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Данные из переменных окружения (настрой их в панели Render!)
const apiId = Number(process.env.TELEGRAM_API_ID); 
const apiHash = process.env.TELEGRAM_API_HASH;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const stringSession = new StringSession("");

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

// Функции для работы с "базой данных" db.json
const dbPath = path.join(__dirname, "db.json");
const getDB = () => {
    if (!fs.existsSync(dbPath)) return { files: [] };
    try {
        const data = fs.readFileSync(dbPath, "utf-8");
        return JSON.parse(data);
    } catch (e) { return { files: [] }; }
};
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

async function startServer() {
  try {
    console.log("Авторизация в Telegram...");
    await client.start({ botAuthToken: botToken });
    console.log("--- СЕРВЕР KRN SYSTEM ЗАПУЩЕН ---");

    // Главная страница (чтобы не было ошибки "Cannot GET /")
    app.get("/", (req, res) => {
      res.send("KRN SYSTEM Backend is running!");
    });

    // Получение списка файлов для сайта
    app.get("/files", (req, res) => {
      const db = getDB();
      res.json(db.files || []);
    });

    // Загрузка файла
    app.post("/upload", upload.single("file"), async (req, res) => {
      try {
        if (!req.file) {
          console.error("Файл не получен в запросе");
          return res.status(400).send("No file uploaded.");
        }

        const filePath = req.file.path;
        const fileName = req.file.filename;

        console.log(`Обработка файла: ${fileName}`);

        // 4. Отправка в Telegram (теперь придет как фото/видео/аудио из-за расширения)
        await client.sendFile(channelId, { 
            file: filePath,
            caption: `Загружено через KRN SYSTEM: ${req.file.originalname}`
        });

        // 5. Сохраняем данные для сайта
        const db = getDB();
        
        // Формируем правильный URL (для Render используем https)
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${fileName}`;

        const newFile = {
            id: Date.now(),
            name: req.file.originalname,
            url: fileUrl,
            type: req.file.mimetype,
            date: new Date().toISOString()
        };

        db.files.push(newFile);
        saveDB(db);
        
        console.log("Файл успешно сохранен в базу и отправлен в ТГ");
        res.status(200).json(newFile);
      } catch (err) {
        console.error("Ошибка при загрузке:", err);
        res.status(500).send("Ошибка сервера при обработке файла.");
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Backend link: http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Ошибка запуска сервера:", err);
  }
}

startServer();