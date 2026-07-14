const crypto = require('crypto');
const { getSettings } = require('./settingsService');

function sha256(data) {
  if (!data) return '';
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

exports.fireServerEvent = async (eventName, order) => {
  const settings = getSettings();
  const eventTime = Math.floor(Date.now() / 1000);
  const eventId = order.pixelEventId || `ZF-EV-${order.id}`;

  const hashedPhone = sha256(order.phone);
  const hashedEmail = order.email ? sha256(order.email) : '';

  // ── 1. Meta Conversions API (CAPI) ──
  const metaPixelId = settings.metaPixelId || process.env.META_PIXEL_ID;
  const metaToken = settings.metaAccessToken || process.env.META_ACCESS_TOKEN;
  if (metaPixelId && metaToken) {
    try {
      const payload = {
        data: [{
          event_name: eventName,
          event_time: eventTime,
          event_id: eventId,
          event_source_url: order.sourceUrl || '',
          action_source: 'website',
          user_data: {
            ph: [hashedPhone],
            em: hashedEmail ? [hashedEmail] : [],
            client_ip_address: order.ip || '',
            client_user_agent: order.userAgent || ''
          },
          custom_data: {
            value: order.amount,
            currency: 'DZD'
          }
        }]
      };

      fetch(`https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(res => console.log('Meta CAPI response:', res))
      .catch(err => console.error('Meta CAPI Error:', err.message));
    } catch (e) {
      console.error('Meta CAPI Trigger Error:', e.message);
    }
  } else {
    console.warn('Meta CAPI not configured. Skipping event.');
  }

  // ── 2. TikTok Events API ──
  const ttPixelId = settings.tiktokPixelId || process.env.TIKTOK_PIXEL_ID;
  const ttToken = settings.tiktokAccessToken || process.env.TIKTOK_ACCESS_TOKEN;
  if (ttPixelId && ttToken) {
    try {
      const payload = {
        pixel_code: ttPixelId,
        event: eventName,
        event_id: eventId,
        timestamp: new Date().toISOString(),
        context: {
          ad: { callback: order.ttclid || '' },
          page: { url: order.sourceUrl || '' },
          user: {
            phone_number: hashedPhone,
            email: hashedEmail || undefined
          },
          user_agent: order.userAgent || '',
          ip: order.ip || ''
        },
        properties: {
          value: order.amount,
          currency: 'DZD'
        }
      };

      fetch('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': ttToken
        },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(res => console.log('TikTok CAPI response:', res))
      .catch(err => console.error('TikTok CAPI Error:', err.message));
    } catch (e) {
      console.error('TikTok CAPI Trigger Error:', e.message);
    }
  } else {
    console.warn('TikTok Events API not configured. Skipping event.');
  }

  // ── 3. Snapchat Conversions API ──
  const snapPixelId = settings.snapPixelId || process.env.SNAP_PIXEL_ID;
  const snapToken = settings.snapAccessToken || process.env.SNAP_ACCESS_TOKEN;
  if (snapPixelId && snapToken) {
    try {
      const payload = {
        pixel_id: snapPixelId,
        event_type: eventName === 'Purchase' ? 'PURCHASE' : 'PAGE_VIEW',
        event_id: eventId,
        timestamp: Date.now(),
        user_hashed_phone_number: hashedPhone,
        user_hashed_email: hashedEmail || undefined,
        price: order.amount,
        currency: 'DZD'
      };

      fetch('https://tr.snapchat.com/v2/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${snapToken}`
        },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(res => console.log('Snap CAPI response:', res))
      .catch(err => console.error('Snap CAPI Error:', err.message));
    } catch (e) {
      console.error('Snap CAPI Trigger Error:', e.message);
    }
  } else {
    console.warn('Snapchat CAPI not configured. Skipping event.');
  }
};
