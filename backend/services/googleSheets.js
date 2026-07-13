const { google } = require('googleapis');

exports.syncOrder = async (order) => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!email || !privateKey || !spreadsheetId) {
    console.warn('⚠️ Google Sheets credentials not configured. Skipping sheet sync.');
    return false;
  }

  try {
    const auth = new google.auth.JWT(
      email,
      null,
      privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    
    const variant = order.variant || order.size || '';
    const quantity = order.quantity || 1;
    const dateStr = order.date || new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Orders!A:O',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            order.id,
            order.name,
            order.phone,
            order.wilaya,
            order.commune || '',
            order.address || '',
            order.product,
            variant,
            quantity,
            order.amount,
            order.status,
            dateStr,
            order.source || 'Direct',
            order.utm || '',
            order.pixelEventId || ''
          ]
        ]
      }
    });

    console.log(`✅ Order ${order.id} synced to Google Sheets successfully.`);
    return true;
  } catch (err) {
    console.error('❌ Error syncing order to Google Sheets:', err.message);
    return false;
  }
};
