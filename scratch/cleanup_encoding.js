
import fs from 'fs';
import path from 'path';

const filesToClean = [
  'src/screens/Auth.jsx',
  'src/screens/FaceIDScreen.jsx',
  'src/screens/Profile.jsx',
  'src/screens/FaceRecognitionPage.jsx',
  'src/App.jsx'
];

filesToClean.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace non-ASCII characters with spaces or remove them
    const cleaned = content.replace(/[^\x00-\x7F]/g, (char) => {
      console.log(`Removing character ${char} from ${file}`);
      return ' ';
    });
    fs.writeFileSync(fullPath, cleaned);
  }
});

console.log('Cleanup complete.');
