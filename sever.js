const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// 定義資料夾與檔案路徑
const DATA_DIR = path.join(__dirname, 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const FAVS_FILE = path.join(DATA_DIR, 'favorites.json');
const SAVINGS_FILE = path.join(__dirname, 'data', 'savings.json');

app.use(cors());
app.use(bodyParser.json());

// 啟動時檢查並建立 data 資料夾
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// --- 帳目紀錄 API ---

app.get('/api/records', (req, res) => {
    if (fs.existsSync(RECORDS_FILE)) {
        res.json(JSON.parse(fs.readFileSync(RECORDS_FILE)));
    } else {
        res.json([]);
    }
});

app.post('/api/records', (req, res) => {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ message: '紀錄已存檔' });
});

// --- 存款總額 API ---
app.get('/api/savings', (req, res) => {
    if (fs.existsSync(SAVINGS_FILE)) {
        res.json(JSON.parse(fs.readFileSync(SAVINGS_FILE)));
    } else {
        res.json({ total: 0 }); // 初始存款為 0
    }
});

app.post('/api/savings', (req, res) => {
    fs.writeFileSync(SAVINGS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ message: '存款已更新' });
});

// --- 常用項目 API (這是讓它不消失的關鍵) ---

app.get('/api/favorites', (req, res) => {
    if (fs.existsSync(FAVS_FILE)) {
        res.json(JSON.parse(fs.readFileSync(FAVS_FILE)));
    } else {
        // 如果檔案不存在，回傳一些預設值
        const defaultFavs = ["早餐", "午餐", "晚餐", "交通", "飲料"];
        res.json(defaultFavs);
    }
});

app.post('/api/favorites', (req, res) => {
    try {
        fs.writeFileSync(FAVS_FILE, JSON.stringify(req.body, null, 2));
        res.json({ message: '常用項目已存檔' });
    } catch (err) {
        res.status(500).json({ error: '存檔失敗' });
    }
});

app.listen(PORT, () => {
    console.log(`伺服器運行中：http://localhost:${PORT}`);
    console.log(`資料存放路徑：${DATA_DIR}`);
});