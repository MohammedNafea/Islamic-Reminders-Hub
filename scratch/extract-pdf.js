const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    try {
        const data = await pdf(dataBuffer);
        console.log('Text extracted from:', pdfPath);
        console.log('Content (first 1000 chars):');
        console.log(data.text.substring(0, 1000));
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
    }
}

const pdfPath = 'd:/Islamic-Reminders-Hub/attached_assets/الرقية_الشرعية__1778598168440.pdf';
extractText(pdfPath);
