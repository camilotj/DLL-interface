import * as fs from 'fs';
import * as path from 'path';

// Search function to find DLLs in the directory structure
function findDlls(dir: string, filePattern: RegExp): string[] {
  const results: string[] = [];
  
  function searchDir(currentDir: string): void {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else if (file.match(filePattern)) {
        results.push(fullPath);
      }
    }
  }
  
  searchDir(dir);
  return results;
}

// Look for TMG IO-Link DLLs in the project directory
const dllPattern = /TMGIOLUSBIF.*\.dll/i;
const dlls = findDlls(__dirname, dllPattern);

if (dlls.length === 0) {
  console.log('No TMG IO-Link DLLs found in the project directory!');
  console.log('You need to obtain the DLL files from the TMG package.');
} else {
  console.log('Found DLLs:');
  dlls.forEach(dll => {
    console.log(`- ${dll}`);
    // Check if the DLL is 32-bit or 64-bit (basic PE header check)
    const data = fs.readFileSync(dll);
    const peOffset = data.readUInt32LE(0x3c);
    const machine = data.readUInt16LE(peOffset + 4);
    console.log(`  Architecture: ${machine === 0x8664 ? '64-bit' : machine === 0x014c ? '32-bit' : 'unknown'}`);
  });
}