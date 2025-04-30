// controllers/featureController.js
const { spawn } = require('child_process');
const path      = require('path');

exports.analyzeImages = (req, res) => {
  console.log('⚡ analyzeImages called, files:', req.files.length);

  let imagesB64, labels;
  try {
    imagesB64 = req.files.map(f => f.buffer.toString('base64'));
    labels    = JSON.parse(req.body.labels);
  } catch (e) {
    console.error('❌ Invalid input:', e);
    return res.status(400).json({ error: 'Неправильний формат даних' });
  }

  const payload = JSON.stringify({ images: imagesB64, labels });
  const script  = path.join(__dirname, '../scripts/main_b64.py');

  const py = spawn('python', [script], { stdio: ['pipe','pipe','pipe'] });

  // 1) Обробляємо помилки запуску
  py.on('error', err => {
    console.error('❌ Cannot start Python:', err);
    return res.status(500).json({ error: 'Не вдалось запустити Python' });
  });

  // 2) Обробляємо помилки stdin (write EOF тощо)
  py.stdin.on('error', err => {
    console.warn('⚠️ stdin error:', err);
    // нічого не кидаємо, просто логуймо
  });

  // 3) Збираємо stdout/stderr
  let out = '', errBuf = '';
  py.stdout.on('data', chunk => { out    += chunk.toString(); });
  py.stderr.on('data', chunk => { errBuf += chunk.toString(); });

  // 4) Коли процес завершується
  py.on('close', code => {
    console.log(`🐍 Python exited with ${code}`);
    if (code !== 0) {
      console.error('Python stderr:', errBuf);
      return res.status(500).json({ error: errBuf.trim() || 'Python error' });
    }
    try {
      const result = JSON.parse(out);
      return res.json(result);
    } catch (e) {
      console.error('❌ Broken JSON from Python:', out);
      return res.status(500).json({ error: 'Неочікуваний формат відповіді' });
    }
  });

  // 5) Передаємо дані
  try {
    py.stdin.write(payload);
    py.stdin.end();
  } catch (e) {
    console.warn('⚠️ Write to stdin failed:', e);
    // сервер не падає
  }
};
