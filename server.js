const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const app = express();
const db = new Database('contacts.db');

app.use(express.json());
app.use(express.static('public')); 

// 初始化資料庫：建立資料表
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// --- 改動 1：新增統計 API (展現進階溝通能力) ---
app.get('/stats', (req, res) => {
    // 從資料庫計算總人數
    const stats = db.prepare('SELECT COUNT(*) as total FROM contacts').get();
    res.json(stats); 
});

// [GET] 搜尋聯絡人
app.get('/contacts', (req, res) => {
    const keyword = req.query.keyword || '';
    const stmt = db.prepare('SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? ORDER BY id DESC');
    const rows = stmt.all(`%${keyword}%`, `%${keyword}%`);
    res.json(rows);
});

// --- 改動 2：加強 POST 驗證 (後端管理功能) ---
app.post('/contacts', (req, res) => {
    const { name, phone } = req.body;
    // 防呆：如果姓名或電話太短，拒絕寫入資料庫
    if (!name || name.length < 2) return res.status(400).json({ error: '姓名至少需 2 個字' });
    if (!phone || phone.length < 8) return res.status(400).json({ error: '電話號碼格式不正確' });

    const stmt = db.prepare('INSERT INTO contacts (name, phone) VALUES (?, ?)');
    const result = stmt.run(name, phone);
    res.json({ id: result.lastInsertRowid });
});

// [PUT] 修改聯絡人
app.put('/contacts/:id', (req, res) => {
    const { name, phone } = req.body;
    const stmt = db.prepare('UPDATE contacts SET name = ?, phone = ? WHERE id = ?');
    stmt.run(name, phone, req.params.id);
    res.json({ message: '更新成功' });
});

// [DELETE] 刪除聯絡人
app.delete('/contacts/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: '刪除成功' });
});

// --- 改動 3：動態 Port 設定 (Zeabur 部署必備) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`伺服器運行中：http://localhost:${PORT}`);
});