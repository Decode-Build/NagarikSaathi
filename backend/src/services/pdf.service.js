const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { crypto } = require('crypto');

const generatePdf = async (data, jobId) => {
  const templatePath = path.join(__dirname, '../templates/handout.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Simple templating
  Object.keys(data).forEach(key => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || 'N/A');
  });

  // Ensure public directory exists
  const publicDir = path.join(__dirname, '../../public/handouts');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const fileName = `${jobId}.pdf`;
  const filePath = path.join(publicDir, fileName);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: filePath, format: 'A4', printBackground: true });
  await browser.close();

  // In a real app, upload to S3 here and return S3 URL.
  // We'll return the local relative path which can be served by Express static middleware.
  return `/handouts/${fileName}`;
};

module.exports = { generatePdf };
