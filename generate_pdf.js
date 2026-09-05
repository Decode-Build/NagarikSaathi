import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlPath = path.join(__dirname, 'generate_defense_pdf.html');
const pdfPath = path.join(__dirname, 'NagarikSaathi_Hackathon_Defense_Playbook.pdf');

console.log('Generating PDF from:', htmlPath);
console.log('Output PDF destination:', pdfPath);

const args = [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`,
  htmlPath
];

execFile(edgePath, args, (error, stdout, stderr) => {
  if (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
  
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`SUCCESS! Generated PDF (${(stats.size / 1024).toFixed(1)} KB): ${pdfPath}`);
  } else {
    console.error('PDF file was not created.');
    process.exit(1);
  }
});
