const fs = require('fs-extra');
const path = require('path');

const cookieFile = path.resolve(__dirname, '../cookies.json');

async function saveSession(page) {
  const cookies = await page.cookies();
  await fs.writeJSON(cookieFile, cookies, { spaces: 2 });
  console.log('Cookies disimpan.');
}

async function loadSession(page) {
  try {
    if (await fs.exists(cookieFile)) {
      const cookies = await fs.readJSON(cookieFile);
      await page.setCookie(...cookies);
      console.log('Cookies dimuat.');
    }
  } catch (err) {
    console.error('Gagal memuat cookies:', err.message);
  }
}

module.exports = { saveSession, loadSession };
