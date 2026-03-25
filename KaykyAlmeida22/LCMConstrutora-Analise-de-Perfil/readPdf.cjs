const fs = require('fs');
const { PdfReader } = require('pdfreader');

let fullText = '';
new PdfReader().parseFileItems("LCM_Plataforma_V1_Briefing.pdf", (err, item) => {
  if (err) console.error("error:", err);
  else if (!item) {
      fs.writeFileSync("pdf-output.txt", fullText);
      console.log("PDF extraction successful.");
  }
  else if (item.text) fullText += item.text + '\n';
});
