const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

const defaultSettings = {
  // Store info
  storeName: 'زاڤيرا كوفتان',
  whatsappNumber: '+213 XXX XXX XXX',
  email: 'contact@zaphera.dz',
  description: 'دار أزياء جزائرية فاخرة — قفطان، كراكو، فساتين سهرة وزفاف بلمسة جزائرية أصيلة.',
  // Shipping info
  shippingCost: 400,
  deliveryTime: '3 - 5 أيام عمل',
  shippingCompany: 'Yalidine',
  
  // Google Sheets
  googleEmail: '',
  googlePrivateKey: '',
  googleSpreadsheetId: '',
  
  // Meta Pixel
  metaPixelId: '',
  metaAccessToken: '',
  
  // TikTok Pixel
  tiktokPixelId: '',
  tiktokAccessToken: '',
  
  // Snapchat Pixel
  snapPixelId: '',
  snapAccessToken: ''
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8') || '{}');
      return { ...defaultSettings, ...saved };
    }
  } catch (err) {
    console.error('Error reading settings file:', err);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  try {
    // Ensure the data directory exists just in case
    const dataDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing settings file:', err);
    return false;
  }
}

module.exports = {
  getSettings,
  saveSettings
};
