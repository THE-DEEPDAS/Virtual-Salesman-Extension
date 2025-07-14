console.log('🎯 Testing SalesmanBot Extension - Updated Version');
console.log('================================================');

const fs = require('fs');

// Test manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  console.log('✅ Manifest is valid JSON');
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Manifest Version: ${manifest.manifest_version}`);
  console.log(`   Has sidePanel permission: ${manifest.permissions.includes('sidePanel')}`);
  console.log(`   Has side_panel config: ${!!manifest.side_panel}`);
  console.log(`   Default popup: ${manifest.action.default_popup}`);
} catch (error) {
  console.error('❌ Manifest error:', error.message);
}

// Test popup.html for preferences button
try {
  const popupHtml = fs.readFileSync('popup.html', 'utf8');
  console.log(`✅ Popup HTML exists`);
  console.log(`   Has preferences button: ${popupHtml.includes('preferencesBtn')}`);
  console.log(`   Has brain emoji: ${popupHtml.includes('🧠')}`);
} catch (error) {
  console.error('❌ Popup HTML error:', error.message);
}

// Test popup.js for handlePreferencesClick
try {
  const popupJs = fs.readFileSync('popup.js', 'utf8');
  console.log(`✅ Popup JS exists`);
  console.log(`   Has preferences handler: ${popupJs.includes('handlePreferencesClick')}`);
  console.log(`   Has OPEN_PREFERENCES message: ${popupJs.includes('OPEN_PREFERENCES')}`);
} catch (error) {
  console.error('❌ Popup JS error:', error.message);
}

// Test background.js for preferences handling
try {
  const backgroundJs = fs.readFileSync('background.js', 'utf8');
  console.log(`✅ Background JS exists`);
  console.log(`   Handles OPEN_PREFERENCES: ${backgroundJs.includes('OPEN_PREFERENCES')}`);
  console.log(`   Uses sidePanel.open: ${backgroundJs.includes('sidePanel.open')}`);
  console.log(`   No auto sidePanel: ${!backgroundJs.includes('setPanelBehavior')}`);
} catch (error) {
  console.error('❌ Background JS error:', error.message);
}

console.log('\n🎉 Extension Test Complete!');
console.log('\n📝 Expected Behavior:');
console.log('1. ✅ Extension icon opens POPUP (main chat interface)');
console.log('2. ✅ Brain icon (🧠) in popup opens SIDEBAR (preferences)');
console.log('3. ✅ Main functionality: Chat in popup, preferences on demand');
console.log('4. ✅ No automatic sidebar opening');
