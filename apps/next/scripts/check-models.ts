import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    console.error("❌ No API Key found in .env.local");
    return;
  }

  console.log("🔍 Asking Google for available models...");
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ API Error:", data.error.message);
      return;
    }

    // Filter for "generateContent" models (the ones we can use)
    const available = data.models
      .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m: any) => m.name.replace('models/', '')); // Remove prefix for readability

    console.log("✅ AVAILABLE MODELS:", available);
    
    // Check if Flash is there
    const hasFlash = available.some((m: string) => m.includes('flash'));
    console.log(`⚡ Can we use Flash? ${hasFlash ? 'YES' : 'NO'}`);

  } catch (e) {
    console.error("Network Error:", e);
  }
}

listModels();