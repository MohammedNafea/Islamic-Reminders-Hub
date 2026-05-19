const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(pdfPath) {
    let dataBuffer = fs.readFileSync(pdfPath);
    try {
        const data = await pdf(dataBuffer);
        console.log("--- TEXT START ---");
        console.log(data.text);
        console.log("--- TEXT END ---");
    } catch (error) {
        console.error("Error parsing PDF:", error);
    }
}

const targetPath = process.argv[2];
if (targetPath) {
    extractText(targetPath);
} else {
    console.log("Please provide a PDF path");
}
