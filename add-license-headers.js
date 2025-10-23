#!/usr/bin/env node

/**
 * Script to add license headers to all source code files
 * Author: Saleem Ahmad
 * Email: saleem.ahmad@rediffmail.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// License header template
const LICENSE_HEADER = `/**
 * Teacher Timetable Extraction System
 * 
 * @author Saleem Ahmad
 * @email saleem.ahmad@rediffmail.com
 * @created October 2025
 * 
 * @license MIT License (Non-Commercial Use Only)
 * 
 * Copyright (c) 2025 Saleem Ahmad
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to use
 * the Software for educational, learning, and personal purposes only, subject
 * to the following conditions:
 * 
 * 1. The above copyright notice and this permission notice shall be included in
 *    all copies or substantial portions of the Software.
 * 
 * 2. COMMERCIAL USE RESTRICTION: The Software may NOT be used for commercial
 *    purposes, including but not limited to selling, licensing, or incorporating
 *    into commercial products or services, without explicit written permission
 *    from the author.
 * 
 * 3. LEARNING YOGI ASSIGNMENT: This Software was created specifically for the
 *    Learning Yogi (LY) assignment purpose and should be used as a reference
 *    or learning material only.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * For commercial use inquiries, please contact: saleem.ahmad@rediffmail.com
 */

`;

// Function to check if file already has license header
function hasLicenseHeader(content) {
  return content.includes('@author Saleem Ahmad') || 
         content.includes('saleem.ahmad@rediffmail.com') ||
         content.includes('Learning Yogi');
}

// Function to add license header to file
function addLicenseHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has license
    if (hasLicenseHeader(content)) {
      console.log(`⏭️  Skipped (already has license): ${filePath}`);
      return false;
    }
    
    // Add license header at the top
    const newContent = LICENSE_HEADER + '\n' + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added license header: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all TypeScript/TSX files
function findSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, .git directories
      if (!['node_modules', 'dist', 'build', '.git', 'uploads'].includes(file)) {
        findSourceFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip declaration files and config files
      if (!file.endsWith('.d.ts') && 
          !file.includes('vite.config') && 
          !file.includes('jest.config') &&
          !file.includes('tailwind.config')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Main execution
console.log('🔍 Searching for source code files...\n');

const backendDir = path.join(__dirname, 'backend', 'src');
const frontendDir = path.join(__dirname, 'frontend', 'src');

const backendFiles = fs.existsSync(backendDir) ? findSourceFiles(backendDir) : [];
const frontendFiles = fs.existsSync(frontendDir) ? findSourceFiles(frontendDir) : [];

const allFiles = [...backendFiles, ...frontendFiles];

console.log(`📁 Found ${allFiles.length} source files\n`);
console.log('📝 Adding license headers...\n');

let addedCount = 0;
let skippedCount = 0;

allFiles.forEach(file => {
  if (addLicenseHeader(file)) {
    addedCount++;
  } else {
    skippedCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✨ License headers added successfully!`);
console.log(`✅ Added: ${addedCount} files`);
console.log(`⏭️  Skipped: ${skippedCount} files`);
console.log('='.repeat(50));
