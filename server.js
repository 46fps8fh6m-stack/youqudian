require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const syncRouter = require('./routes/kkcamSync');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use('/api/sync', syncRouter);
app.use(express.static(path.join(__dirname, '.')));

app.listen(PORT, () => {
  console.log(`有趣点相机屋 · 静态页 + 同步接口 http://127.0.0.1:${PORT}`);
});
