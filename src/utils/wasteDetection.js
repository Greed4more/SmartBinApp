/**
 * Waste Detection and Classification Module
 * Uses Google Vision API to identify waste items and classify them
 */

const WASTE_CATEGORIES = {
  metal: { name: 'Metal', recyclable: true, hazardous: false, color: '#4A7C4E' },
  plastic: { name: 'Plastic', recyclable: true, hazardous: false, color: '#4A7C4E' },
  paper: { name: 'Paper', recyclable: true, hazardous: false, color: '#4A7C4E' },
  glass: { name: 'Glass', recyclable: true, hazardous: false, color: '#4A7C4E' },
  dry: { name: 'Dry Waste', recyclable: true, hazardous: false, color: '#4A7C4E' },
  wet: { name: 'Organic/Wet Waste', recyclable: false, hazardous: false, color: '#E85454' },
  ewaste: { name: 'E-Waste', recyclable: false, hazardous: true, color: '#E85454' },
  hazardous: { name: 'Hazardous', recyclable: false, hazardous: true, color: '#E85454' },
  unknown: { name: 'Unknown', recyclable: false, hazardous: false, color: '#8E8E8A' }
};

const WASTE_DATABASE = {
  // Metal items
  'soda can': { category: 'metal', recyclable: true, hazardous: false, disposal_tip: 'Rinse thoroughly and place in metal recycling bin.' },
  'aluminum can': { category: 'metal', recyclable: true, hazardous: false, disposal_tip: 'Rinse thoroughly and place in metal recycling bin.' },
  'tin can': { category: 'metal', recyclable: true, hazardous: false, disposal_tip: 'Rinse thoroughly and place in metal recycling bin.' },
  'metal can': { category: 'metal', recyclable: true, hazardous: false, disposal_tip: 'Rinse thoroughly and place in metal recycling bin.' },
  'fork': { category: 'metal', recyclable: false, hazardous: false, disposal_tip: 'Metal utensils go to regular trash or recycling depending on contamination.' },
  'spoon': { category: 'metal', recyclable: false, hazardous: false, disposal_tip: 'Metal utensils go to regular trash or recycling depending on contamination.' },
  'knife': { category: 'metal', recyclable: false, hazardous: false, disposal_tip: 'Metal utensils go to regular trash or recycling depending on contamination.' },
  
  // Plastic items
  'water bottle': { category: 'plastic', recyclable: true, hazardous: false, disposal_tip: 'Remove cap, rinse, and crush before placing in plastic recycling.' },
  'plastic bottle': { category: 'plastic', recyclable: true, hazardous: false, disposal_tip: 'Remove cap, rinse, and crush before placing in plastic recycling.' },
  'plastic bag': { category: 'plastic', recyclable: false, hazardous: false, disposal_tip: 'Plastic bags should NOT go in recycling bins. Take to store for recycling.' },
  'plastic container': { category: 'plastic', recyclable: true, hazardous: false, disposal_tip: 'Rinse and place in plastic recycling bin.' },
  'pet bottle': { category: 'plastic', recyclable: true, hazardous: false, disposal_tip: 'Rinse, crush, and place in recycling.' },
  
  // Paper items
  'cardboard box': { category: 'paper', recyclable: true, hazardous: false, disposal_tip: 'Flatten boxes and place in paper recycling.' },
  'cardboard': { category: 'paper', recyclable: true, hazardous: false, disposal_tip: 'Flatten and place in paper recycling bin.' },
  'newspaper': { category: 'paper', recyclable: true, hazardous: false, disposal_tip: 'Bundle and place in paper recycling.' },
  'magazine': { category: 'paper', recyclable: true, hazardous: false, disposal_tip: 'Place in paper recycling bin.' },
  'paper': { category: 'paper', recyclable: true, hazardous: false, disposal_tip: 'Place in paper recycling bin.' },
  'book': { category: 'paper', recyclable: true, hazardous: false, disposal_tip: 'Remove from plastic covers and place in paper recycling.' },
  
  // Glass items
  'glass bottle': { category: 'glass', recyclable: true, hazardous: false, disposal_tip: 'Rinse and place in glass recycling bin.' },
  'wine bottle': { category: 'glass', recyclable: true, hazardous: false, disposal_tip: 'Rinse and place in glass recycling.' },
  'beer bottle': { category: 'glass', recyclable: true, hazardous: false, disposal_tip: 'Rinse and place in glass recycling.' },
  'glass': { category: 'glass', recyclable: true, hazardous: false, disposal_tip: 'Place broken glass in designated container.' },
  'jar': { category: 'glass', recyclable: true, hazardous: false, disposal_tip: 'Rinse and place in glass recycling.' },
  
  // Organic/Wet waste
  'banana peel': { category: 'wet', recyclable: false, hazardous: false, disposal_tip: 'Place in organic/compost bin.' },
  'apple core': { category: 'wet', recyclable: false, hazardous: false, disposal_tip: 'Place in organic/compost bin.' },
  'food waste': { category: 'wet', recyclable: false, hazardous: false, disposal_tip: 'Place in organic/compost bin.' },
  'fruit': { category: 'wet', recyclable: false, hazardous: false, disposal_tip: 'Place in organic/compost bin.' },
  'vegetable': { category: 'wet', recyclable: false, hazardous: false, disposal_tip: 'Place in organic/compost bin.' },
  'leaves': { category: 'wet', recyclable: false, hazardous: false, disposal_tip: 'Place in yard waste bin.' },
  'grass': { category: 'wet', recyclable: false, hazardous: false, disposal_tip: 'Place in yard waste bin.' },
  
  // E-Waste
  'battery': { category: 'ewaste', recyclable: false, hazardous: true, disposal_tip: 'Take to e-waste facility. Do not throw in trash!' },
  'phone': { category: 'ewaste', recyclable: false, hazardous: true, disposal_tip: 'Take to e-waste recycling center.' },
  'laptop': { category: 'ewaste', recyclable: false, hazardous: true, disposal_tip: 'Take to e-waste recycling center.' },
  'computer': { category: 'ewaste', recyclable: false, hazardous: true, disposal_tip: 'Take to e-waste recycling center.' },
  'lithium battery': { category: 'ewaste', recyclable: false, hazardous: true, disposal_tip: 'Hazardous! Take to e-waste facility immediately.' },
  
  // Hazardous
  'paint': { category: 'hazardous', recyclable: false, hazardous: true, disposal_tip: 'Contact hazardous waste facility for disposal.' },
  'chemical': { category: 'hazardous', recyclable: false, hazardous: true, disposal_tip: 'Contact hazardous waste facility for disposal.' },
  'oil': { category: 'hazardous', recyclable: false, hazardous: true, disposal_tip: 'Take to hazardous waste collection point.' },
};

/**
 * Detect waste from image using Vision API
 * Falls back to simple image analysis if API unavailable
 */
export async function detectWaste(imageDataUrl) {
  try {
    // Try to use Google Vision API
    const result = await detectWithVisionAPI(imageDataUrl);
    if (result) return result;
  } catch (err) {
    console.warn('Vision API failed, using fallback detection:', err);
  }
  
  // Fallback: Use color analysis and simple detection
  try {
    const result = await detectWithColorAnalysis(imageDataUrl);
    if (result) return result;
  } catch (err) {
    console.warn('Color analysis failed:', err);
  }
  
  // Last resort: Return unknown
  return classifyWaste('unknown');
}

/**
 * Detect waste using Google Cloud Vision API
 */
async function detectWithVisionAPI(imageDataUrl) {
  const apiKey = process.env.REACT_APP_GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

  try {
    const base64Image = imageDataUrl.split(',')[1];
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (data.responses && data.responses[0]) {
      const labels = data.responses[0].labelAnnotations || [];
      const objects = data.responses[0].localizedObjectAnnotations || [];
      
      // Combine labels and objects
      const detections = [
        ...labels.map(l => l.description.toLowerCase()),
        ...objects.map(o => o.name.toLowerCase())
      ];
      
      console.log('Detected items:', detections);
      
      // Find best matching waste type
      for (const detection of detections) {
        const match = findWasteMatch(detection);
        if (match) return match;
      }
    }
  } catch (err) {
    console.error('Vision API error:', err);
  }
  
  return null;
}

/**
 * Detect waste using simple color and brightness analysis
 * Works entirely in browser without external dependencies
 */
async function detectWithColorAnalysis(imageDataUrl) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    
    img.src = imageDataUrl;
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate average color
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        console.log(`Detected colors: R=${r}, G=${g}, B=${b}`);
        
        // Analyze dominant color to guess waste type
        const result = analyzeWasteByColor(r, g, b);
        resolve(result);
      };
      
      img.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Color analysis error:', err);
    return null;
  }
}

/**
 * Guess waste type based on dominant color
 */
function analyzeWasteByColor(r, g, b) {
  // Calculate brightness
  const brightness = (r + g + b) / 3;
  
  // Determine dominant color
  let maxChannel = Math.max(r, g, b);
  
  // Green dominant - likely organic/plant waste
  if (g > r * 1.2 && g > b * 1.2) {
    return classifyWaste('banana peel');
  }
  
  // Gray/silver dominant - likely metal
  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && brightness > 100) {
    return classifyWaste('soda can');
  }
  
  // Brown dominant - likely paper/cardboard
  if (r > g * 1.1 && r > b * 1.1 && g > b * 0.9) {
    return classifyWaste('cardboard box');
  }
  
  // Clear/white dominant - likely plastic or glass
  if (brightness > 180) {
    return classifyWaste('water bottle');
  }
  
  // Dark dominant - could be many things, default to unknown
  if (brightness < 80) {
    return classifyWaste('unknown');
  }
  
  // Default fallback
  return null;
}

/**
 * Find matching waste in database
 */
function findWasteMatch(itemName) {
  // Exact match
  if (WASTE_DATABASE[itemName]) {
    return classifyWaste(itemName);
  }
  
  // Partial match
  for (const [key, data] of Object.entries(WASTE_DATABASE)) {
    if (itemName.includes(key) || key.includes(itemName)) {
      return classifyWaste(key);
    }
  }
  
  return null;
}

/**
 * Classify waste and return complete information
 */
export function classifyWaste(itemName) {
  const wasteData = WASTE_DATABASE[itemName.toLowerCase()] || {
    category: 'unknown',
    recyclable: false,
    hazardous: false,
    disposal_tip: 'Unable to classify. Please consult local waste guidelines.'
  };
  
  const categoryInfo = WASTE_CATEGORIES[wasteData.category];
  
  return {
    item_name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
    category: wasteData.category,
    description: `${categoryInfo.name} waste item`,
    recyclable: wasteData.recyclable,
    hazardous: wasteData.hazardous,
    disposal_tip: wasteData.disposal_tip,
    confidence: 85,
    eco_coins_earned: calculateEcoCoins(wasteData.recyclable, wasteData.hazardous)
  };
}

/**
 * Calculate eco coins based on waste type
 */
function calculateEcoCoins(recyclable, hazardous) {
  if (hazardous) return 2;
  if (recyclable) return 15;
  return 5;
}

/**
 * Get all waste categories
 */
export function getWasteCategories() {
  return WASTE_CATEGORIES;
}

/**
 * Get disposal tips for a specific waste type
 */
export function getDisposalTips(itemName) {
  const wasteData = WASTE_DATABASE[itemName.toLowerCase()];
  return wasteData ? wasteData.disposal_tip : 'Please consult local waste guidelines.';
}
