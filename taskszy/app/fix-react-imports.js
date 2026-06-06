import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllJsxFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        getAllJsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixReactImport(filePath) {
  let content = readFileSync(filePath, 'utf8');
  
  // Check if file already has React import
  if (content.includes('import React') || !content.includes('from \'react\'') && !content.includes('from "react"')) {
    return false;
  }
  
  // Check if file uses JSX (has < and > for JSX elements)
  if (!content.match(/<[A-Z][a-zA-Z0-9]*/)) {
    return false;
  }
  
  // Add React import at the beginning
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the first import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      insertIndex = i;
      break;
    }
  }
  
  // Check if first import is from 'react'
  if (lines[insertIndex].includes('from \'react\'') || lines[insertIndex].includes('from "react"')) {
    // Modify existing react import
    const match = lines[insertIndex].match(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/);
    if (match) {
      lines[insertIndex] = `import React, {${match[1]}} from 'react';`;
      writeFileSync(filePath, lines.join('\n'), 'utf8');
      return true;
    }
  }
  
  return false;
}

// Fix all JSX files
const srcDir = './src';
const jsxFiles = getAllJsxFiles(srcDir);

let fixed = 0;
jsxFiles.forEach(file => {
  if (fixReactImport(file)) {
    console.log(`Fixed: ${file}`);
    fixed++;
  }
});

console.log(`\nFixed ${fixed} files.`);
