// Vercel Serverless Function: /api/submit
// Принимает результат игрока, сохраняет в Supabase и возвращает таблицу лидеров.
//
// Требуются переменные окружения (Environment Variables в Vercel):
//   SUPABASE_URL       — URL проекта Supabase
//   SUPABASE_ANON_KEY  — публичный anon-ключ Supabase

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase не настроен' });
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1) Записываем результат (только POST)
    if (req.method === 'POST') {
      const { name, score, total } = req.body || {};
      if (typeof name !== 'string' || typeof score !== 'number') {
        return res.status(400).json({ error: 'Некорректные данные' });
      }
      const clean = name.trim().slice(0, 24) || 'Гость';
      await fetch(`${SUPABASE_URL}/rest/v1/results`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: clean, score, total }),
      });
    }

    // 2) Читаем все результаты для статистики и топа
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/results?select=name,score,total&order=score.desc&limit=500`,
      { headers }
    );
    const rows = await r.json();

    const count = rows.length;
    const best = count ? Math.max(...rows.map(x => x.score)) : 0;
    const avg = count ? (rows.reduce((s, x) => s + x.score, 0) / count).toFixed(1) : '0';

    // топ-5: лучший результат каждого игрока (по имени), затем сортировка
    const bestByName = {};
    for (const x of rows) {
      if (!(x.name in bestByName) || x.score > bestByName[x.name].score) {
        bestByName[x.name] = x;
      }
    }
    const top = Object.values(bestByName)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return res.status(200).json({ count, best, avg, top });
  } catch (e) {
    return res.status(500).json({ error: 'Ошибка сервера', detail: String(e) });
  }
}
