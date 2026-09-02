import express from 'express';
import multer from 'multer';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post('/verify', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document image provided.' });
    }

    const expectedName = req.body.expectedName || '';
    const documentType = req.body.documentType || 'Aadhaar Card';

    // Verify Gemini API Key exists
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
    }

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-3.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      maxOutputTokens: 1024,
      temperature: 0.1,
    });

    const mimeType = req.file.mimetype;
    const base64Data = req.file.buffer.toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    const promptText = `
You are an expert AI Document Verification System.
Extract the following information from this ${documentType} image and return it strictly as a JSON object without markdown blocks.
Required JSON fields:
{
  "extractedName": "string or null",
  "dob": "string or null",
  "idNumber": "string or null (mask all except last 4 digits for privacy)",
  "isAuthenticLooking": boolean
}
If a field cannot be read clearly, set it to null. Do not include any explanations, just the JSON.
    `;

    const message = new HumanMessage({
      content: [
        { type: "text", text: promptText },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    });

    const response = await model.invoke([message]);
    let responseText = response.content.trim();
    
    // Clean up markdown code blocks if the model ignores the instruction
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```/g, '').trim();
    }

    let extractedData;
    try {
      extractedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini output:", responseText);
      return res.status(500).json({ error: 'AI returned malformed data. Please ensure the image is clear and try again.' });
    }

    // Cross-check logic (Steps 6 & 7)
    const verificationResults = {
      matches: [],
      mismatches: [],
      missing: []
    };

    if (expectedName) {
      if (!extractedData.extractedName) {
        verificationResults.missing.push(`Could not read name from ${documentType}`);
      } else {
        // Simple fuzzy match (case-insensitive, basic whitespace trim)
        const nameA = extractedData.extractedName.toLowerCase().replace(/\s+/g, '');
        const nameB = expectedName.toLowerCase().replace(/\s+/g, '');
        if (nameA.includes(nameB) || nameB.includes(nameA)) {
          verificationResults.matches.push(`Name matches expected profile: ${expectedName}`);
        } else {
          verificationResults.mismatches.push(`Name mismatch: Expected "${expectedName}", Found "${extractedData.extractedName}"`);
        }
      }
    }

    if (!extractedData.idNumber) {
      verificationResults.missing.push('Could not detect a valid ID Number');
    } else {
      verificationResults.matches.push(`ID Number detected: ${extractedData.idNumber}`);
    }

    if (!extractedData.isAuthenticLooking) {
      verificationResults.mismatches.push('Warning: Document does not appear to be a standard authentic format.');
    }

    return res.json({
      success: true,
      extractedData,
      verificationResults,
      message: 'AI Document Verification Complete'
    });

  } catch (error) {
    console.error('Error in /api/documents/verify:', error);
    res.status(500).json({ error: 'Internal server error during document verification: ' + error.message });
  }
});

export default router;
