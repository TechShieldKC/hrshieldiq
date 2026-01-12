// /api/validate-promo.js
// Server-side promo code validation - codes stay hidden

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: 'No code provided' });
  }

  // Promo codes with discount percentages
  const promoCodes = {
    // 100% off (free) - Demo/VIP/Outreach
    'VIPACCESS': 100,
    'CHURCHCHECK': 100,
    'HRCHECK': 100,
    'TECHSHIELD2026': 100,
    'FAMILYFREE': 100,
    
    // 50% off ($14.99)
    'KCBIZ50': 50,
    'HRSHIELD50': 50
  };

  const upperCode = code.toUpperCase().trim();
  const discount = promoCodes[upperCode];

  if (discount !== undefined) {
    const originalPrice = 29.99;
    const finalPrice = discount === 100 ? 0 : Math.round(originalPrice * (100 - discount)) / 100;
    
    return res.status(200).json({ 
      valid: true, 
      discount: discount,
      finalPrice: finalPrice
    });
  }

  return res.status(200).json({ valid: false });
}
