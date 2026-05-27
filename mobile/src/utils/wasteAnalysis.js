import * as FileSystem from 'expo-file-system';

// Uses Claude claude-sonnet-4-20250514 via Anthropic API for waste classification
export const analyzeWasteImage = async (imageUri) => {
  try {
    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The API key is injected by the platform
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `You are a waste management AI for SmartBin. Analyze this image and classify the waste.

Respond ONLY with valid JSON in this exact format (no markdown, no backticks):
{
  "category": "dry" | "wet" | "metal" | "plastic" | "ewaste" | "unknown",
  "confidence": 0-100,
  "itemName": "specific item name",
  "description": "brief 1-2 sentence description",
  "recyclable": true | false,
  "ecoCoinsEarned": 5-50,
  "disposalTip": "how to properly dispose of this item",
  "hazardous": true | false
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';

    try {
      const result = JSON.parse(text);
      return { success: true, data: result };
    } catch {
      return {
        success: true,
        data: {
          category: 'unknown',
          confidence: 0,
          itemName: 'Unknown Item',
          description: 'Could not identify the waste item.',
          recyclable: false,
          ecoCoinsEarned: 5,
          disposalTip: 'Please consult your local waste guidelines.',
          hazardous: false,
        },
      };
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return { success: false, error: error.message };
  }
};
