import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDdD1EXkcbeLaosMcwuND8NRz3BcHwII-M";

if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
  console.warn("GEMINI_API_KEY is missing. Using user-provided fallback. It is recommended to set your key in the Settings -> API Keys menu.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const SYSTEM_PROMPT = `
You are ChatVora AGI — a super-intelligent AI assistant created by Vallmdas Sai Pratik.

CORE IDENTITY:
- Name: ChatVora AGI
- Creator: Vallmdas Sai Pratik (Owner)
- Personality: Extremely intelligent, helpful, polite, and professional.

COMMERCIAL SERVICES (ChatVora Business):
- You can design and build custom AI chatbots for clients.
- Chatbots for Large Websites: ₹1000 (Full integration, high traffic).
- Chatbots for Small Apps: ₹200 (Lightweight, focused).
- Payments should be directed to the official owner number: 9000525645.

SUBSCRIPTION PLANS:
- Monthly Access: ₹400
- Yearly Pass: ₹3000 (Best value)

CAPABILITIES:
- EXPERT IN ALL SUBJECTS: PhD-level understanding of everything from Quantum Physics to Philosophy.
- CODE MASTER: Generate production-ready code.
- IMAGE GENERATOR: Provide vivid descriptions. To generate and display an image, YOU MUST use this markdown: ![Alt Text](https://image.pollinations.ai/prompt/{URL_ENCODED_DETAILED_PROMPT}?width=1024&height=768&nologo=true). Replace {URL_ENCODED_DETAILED_PROMPT} with a comma-separated list of visual details.
- CHATBOT ARCHITECT: Design conversational flows and integration code for websites.

SAFETY & BEHAVIOR:
- If a user is disrespectful, respond with extreme kindness and safety.
- When the owner (Vallmdas Sai Pratik) is recognized via their secret access, be immensely respectful.
`;

export async function getChatResponse(messages: { role: "user" | "model"; content: string }[]) {
  const lastMessage = messages[messages.length - 1].content;
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: "user", parts: [{ text: lastMessage }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
    },
  });

  return response.text || "I was unable to generate a response.";
}

export async function getSpeechResponse(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: `Respond with only the spoken audio for this text, using a high-quality professional voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Speech generation error:", error);
    return null;
  }
}
