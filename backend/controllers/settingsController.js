const settingsService = require('../services/settingsService');

// GET /api/settings
exports.getSettings = (req, res) => {
  try {
    const settings = settingsService.getSettings();
    res.status(200).json(settings);
  } catch (err) {
    console.error('Get Settings Controller Error:', err);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
};

// POST /api/settings
exports.updateSettings = (req, res) => {
  try {
    const current = settingsService.getSettings();
    const updated = {
      ...current,
      ...req.body
    };
    
    // Ensure data types are correct
    if (updated.shippingCost !== undefined) {
      updated.shippingCost = Number(updated.shippingCost) || 0;
    }

    const success = settingsService.saveSettings(updated);
    if (success) {
      res.status(200).json({ success: true, settings: updated });
    } else {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } catch (err) {
    console.error('Update Settings Controller Error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
