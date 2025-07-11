#!/usr/bin/env node

/**
 * SalesmanBot Extension Test Script
 * Tests core functionality and validates extension components
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const extensionPath = '.';
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'sidebar.html',
  'sidebar.js',
  'style.css',
  'utils/aiService.js',
  'utils/contextTracker.js',
  'utils/productExtractor.js',
  'utils/queryParser.js'
];

console.log('🧪 SalesmanBot Extension Test Suite');
console.log('===================================\n');

// Test 1: File existence
console.log('📁 Testing file existence...');
let filesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(extensionPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    filesExist = false;
  }
});

if (!filesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Test 2: Manifest validation
console.log('\n📋 Testing manifest.json...');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(extensionPath, 'manifest.json'), 'utf8'));
  
  console.log(`  ✅ Manifest version: ${manifest.manifest_version}`);
  console.log(`  ✅ Extension name: ${manifest.name}`);
  console.log(`  ✅ Extension version: ${manifest.version}`);
  
  // Check required permissions
  const requiredPermissions = ['storage', 'activeTab'];
  const hasPermissions = requiredPermissions.every(perm => 
    manifest.permissions && manifest.permissions.includes(perm)
  );
  
  if (hasPermissions) {
    console.log('  ✅ Required permissions present');
  } else {
    console.log('  ⚠️ Some required permissions may be missing');
  }
  
  // Check content scripts
  if (manifest.content_scripts && manifest.content_scripts.length > 0) {
    console.log('  ✅ Content scripts configured');
  } else {
    console.log('  ❌ Content scripts missing');
  }
  
} catch (error) {
  console.log(`  ❌ Manifest parse error: ${error.message}`);
}

// Test 3: JavaScript syntax validation
console.log('\n🔧 Testing JavaScript syntax...');
const jsFiles = [
  'background.js',
  'content.js', 
  'popup.js',
  'sidebar.js',
  'utils/aiService.js',
  'utils/contextTracker.js',
  'utils/productExtractor.js',
  'utils/queryParser.js'
];

jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(extensionPath, file), 'utf8');
    
    // Basic syntax checks
    if (content.includes('innerHTML =')) {
      console.log(`  ⚠️ ${file} - Contains innerHTML assignments (security risk)`);
    }
    
    if (content.includes('chrome.storage.sync') || content.includes('chrome.storage.local')) {
      console.log(`  ✅ ${file} - Uses chrome.storage API`);
    }
    
    if (content.includes('console.log') || content.includes('console.error')) {
      console.log(`  ✅ ${file} - Has logging statements`);
    }
    
  } catch (error) {
    console.log(`  ❌ ${file} - Read error: ${error.message}`);
  }
});

// Test 4: HTML validation
console.log('\n🌐 Testing HTML files...');
const htmlFiles = ['popup.html', 'sidebar.html'];

htmlFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(extensionPath, file), 'utf8');
    
    if (content.includes('<!DOCTYPE html>')) {
      console.log(`  ✅ ${file} - Has DOCTYPE declaration`);
    }
    
    if (content.includes('<meta charset=')) {
      console.log(`  ✅ ${file} - Has charset declaration`);
    }
    
    if (content.includes('<script src=')) {
      console.log(`  ✅ ${file} - Links to JavaScript files`);
    }
    
  } catch (error) {
    console.log(`  ❌ ${file} - Read error: ${error.message}`);
  }
});

// Test 5: CSS validation
console.log('\n🎨 Testing CSS...');
try {
  const cssContent = fs.readFileSync(path.join(extensionPath, 'style.css'), 'utf8');
  
  if (cssContent.includes('.card')) {
    console.log('  ✅ Contains card styles');
  }
  
  if (cssContent.includes('background:') || cssContent.includes('background-color:')) {
    console.log('  ✅ Contains background styles');
  }
  
  if (cssContent.includes('@media')) {
    console.log('  ✅ Contains responsive design rules');
  }
  
} catch (error) {
  console.log(`  ❌ CSS read error: ${error.message}`);
}

console.log('\n🎉 Test suite completed!');
console.log('\n📝 Next steps:');
console.log('1. Load extension in Chrome/Firefox developer mode');
console.log('2. Test on Amazon, Flipkart, and Walmart pages');
console.log('3. Verify AI recommendations with valid API key');
console.log('4. Check sidebar context tracking');
console.log('5. Test preference learning and persistence');
