import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limits to allow image uploads (base64)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Gemini client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini client successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Running with rule-based fail-safe logic.");
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Post body profiling data (and optional image) for Virtual fitting analysis
app.post("/api/fitting/analyze", async (req, res) => {
  const {
    gender = "unisex",
    height = 175,
    weight = 70,
    shoulderWidth = 45,
    waistSize = 31,
    hipSize = 95,
    preferredFit = "regular",
    image = null, // base64 string
    selectedOutfit = null,
  } = req.body;

  // Let's create a robust instruction and format for Gemini
  const promptText = `
    Conduct a professional virtual fitting and style analysis for the following user:
    - Gender/Profile: ${gender}
    - Height: ${height}cm
    - Weight: ${weight}kg
    - Shoulder Width slider ratio/value: ${shoulderWidth}
    - Waist Size: ${waistSize} inches
    - Hip Size: ${hipSize}cm
    - Preferred styling fit: ${preferredFit}
    ${selectedOutfit ? `- Currently Trying On: ${selectedOutfit.name} (${selectedOutfit.category})` : ""}

    If an image of the user is provided, analyze their silhouette, body contour, and outline to estimate body proportions. If no image is provided, rely fully on the provided measurement values to compute body proportions, match their shape class, and recommend fitting adjustments.

    You must output a JSON response matching this TypeScript response structure precisely:
    {
      "bodyType": "Trapezoid" | "Hourglass" | "Inverted Triangle" | "Rectangle" | "Triangle" | "Apple" | "Athletic",
      "proportions": {
        "chest": number (0 to 100, proportion scale relative to average),
        "waist": number (0 to 100),
        "hip": number (0 to 100),
        "shoulder": number (0 to 100),
        "legs": number (0 to 100)
      },
      "fitAnalysis": {
        "tops": "S" | "M" | "L" | "XL" | "XXL",
        "bottoms": "S" | "M" | "L" | "XL" | "XXL",
        "fitMatchScore": number (0 to 100, how well their selected clothes/style fits their proportions)
      },
      "styleVerdict": string (A professional summary in Korean of their physical style profile, recommended colors, silhouette enhancements, and fabric choices),
      "fittingTips": string[] (3 unique Korean recommendations about how to choose necklines, shoulder fits, or hems for their specific proportions to balance their look)
    }
  `;

  // Fail-safe procedural analysis back-up in case Gemini is not available or errors out
  const getFailsafeData = () => {
    // Generate organic sounding body types based on basic heuristics
    let bodyType = "Rectangle";
    let chest = 50;
    let shoulder = Math.min(100, Math.max(0, shoulderWidth));
    let waist = Math.min(100, Math.max(0, (waistSize / 45) * 100));
    let hip = Math.min(100, Math.max(0, (hipSize / 120) * 100));
    let legs = 50;

    if (shoulder > waist + 15) {
      bodyType = gender === "female" ? "Inverted Triangle" : "Athletic / Broad Shoulder";
    } else if (waist > shoulder + 10 && waist > hip) {
      bodyType = "Apple (O-shape)";
    } else if (hip > shoulder + 15) {
      bodyType = "Triangle (A-shape)";
    } else if (gender === "female" && Math.abs(shoulder - hip) < 10 && waist < Math.min(shoulder, hip) - 15) {
      bodyType = "Hourglass";
    } else {
      bodyType = "Trapezoid (Highly Balanced)";
    }

    // Determine estimated sizes based on height & weight
    let size = "M";
    if (height < 160) {
      size = weight < 55 ? "S" : "M";
    } else if (height > 180) {
      size = weight > 85 ? "XXL" : weight > 75 ? "XL" : "L";
    } else {
      size = weight > 75 ? "L" : weight < 60 ? "S" : "M";
    }

    const outfitComment = selectedOutfit ? `현재 선택하신 [${selectedOutfit.name}] 아이템과의 궁합이 훌륭합니다.` : "체형을 커버하고 기럭지를 길어보이게 만드는 실루엣입니다.";

    return {
      bodyType,
      proportions: {
        chest: Math.round(chest),
        waist: Math.round(waist),
        hip: Math.round(hip),
        shoulder: Math.round(shoulder),
        legs: Math.round(legs),
      },
      fitAnalysis: {
        tops: size,
        bottoms: size,
        fitMatchScore: selectedOutfit ? 88 : 92,
      },
      styleVerdict: `분석된 ${bodyType} 체형에 최적화된 가이드입니다. 키 ${height}cm, 체중 ${weight}kg의 실루엣 비율에 매치되도록 세부 밸런싱을 조절했습니다. 전체적으로 어깨라인에서 떨어지는 리드미컬하고 세련된 피팅감이 돋보이며, 어깨 대비 허리가 ${waistSize < 30 ? "슬림" : "안정적" }하여 어떤 웨어플랜도 밸런스있게 소화할 수 있는 실루엣입니다. ${outfitComment}`,
      fittingTips: [
        `${gender === "female" ? "하이웨이스트" : "로 레이어핏"} 세팅을 통해 다리 길이를 조금 더 확장해보이는 시각적 효과를 극대화할 수 있습니다.`,
        "시각적인 시선을 상체 어깨 포인트로 유도하기 위해 숄더라인이 가벼운 루즈핏이나 테일러드 컷을 추천합니다.",
        "허리선과 힙 라인의 턱 디자인을 활용하여 내츄럴한 주름 실루엣을 자연스럽게 형성하면 핏의 풍성함이 배가됩니다."
      ],
      isFallback: true
    };
  };

  if (!ai) {
    return res.json(getFailsafeData());
  }

  try {
    const contentParts: any[] = [];

    // If base64 image is uploaded, we parse it as part of multimodal input
    if (image && image.startsWith("data:")) {
      const commaIndex = image.indexOf(",");
      if (commaIndex !== -1) {
        const mimeType = image.substring(5, image.indexOf(";"));
        const base64Data = image.substring(commaIndex + 1);
        contentParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        });
      }
    }

    contentParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentParts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["bodyType", "proportions", "fitAnalysis", "styleVerdict", "fittingTips"],
          properties: {
            bodyType: { type: Type.STRING },
            proportions: {
              type: Type.OBJECT,
              required: ["chest", "waist", "hip", "shoulder", "legs"],
              properties: {
                chest: { type: Type.INTEGER },
                waist: { type: Type.INTEGER },
                hip: { type: Type.INTEGER },
                shoulder: { type: Type.INTEGER },
                legs: { type: Type.INTEGER },
              },
            },
            fitAnalysis: {
              type: Type.OBJECT,
              required: ["tops", "bottoms", "fitMatchScore"],
              properties: {
                tops: { type: Type.STRING },
                bottoms: { type: Type.STRING },
                fitMatchScore: { type: Type.INTEGER },
              },
            },
            styleVerdict: { type: Type.STRING },
            fittingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ ...parsedData, isFallback: false });
  } catch (error) {
    console.error("Gemini API Fitting Analysis Error:", error);
    // Return graceful failsafe data on error
    return res.json(getFailsafeData());
  }
});

// Chat support style advisory endpoint
app.post("/api/fitting/chat", async (req, res) => {
  const { messages = [], measurements = {} } = req.body;

  if (!ai) {
    // Graceful response simulation
    return res.json({
      reply: `[IPTA 스타일 컨설턴트] 안녕하세요! 체형 데이터를 기반으로 가이드를 도와드리는 IPTA AI 리얼 타임 비서입니다. (GEMINI_API_KEY 인증이 완료되지 않아 사전 구성된 가이드가 발송되었습니다.)\n\n현재 키 ${measurements.height || 175}cm, 몸무게 ${measurements.weight || 70}kg, 허리 ${measurements.waistSize || 31}인치 세팅에 맞춘 핏 분석 결과, 착용 시 루즈핏의 어깨라인과 미적인 드레이프를 감상할 수 있는 컴포트 스타일이 베스트 매칭됩니다. 원하시는 무드나 옷 소재에 대해 더 궁금한 점이 있으시다면 언제든 말씀해 주세요.`
    });
  }

  try {
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    // Start Chat
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `
          You are 'IPTA AI Style Coach', a friendly, highly professional Korean fashion stylist and wardrobe advisor.
          The user is interacting in an AI Virtual Fitting Environment.
          Here are their physical parameters:
          Height: ${measurements.height || "unknown"}cm, Weight: ${measurements.weight || "unknown"}kg,
          Shoulder Width Ratio: ${measurements.shoulderWidth || "unknown"}, Waist: ${measurements.waistSize || "unknown"} inches, Hips: ${measurements.hipSize || "unknown"}cm.
          
          Respond conversationally in elegant, style-conscious Korean. Keep your advice practical, aesthetic, and direct. Use bullet points or short paragraphs where helpful. Suggest specific styles (e.g. A-line, boxy, cropped shirts, tapered jeans) based on their body metrics.
        `,
      },
      history: formattedMessages.slice(0, -1), // Everything except the very last message
    });

    const lastMessage = formattedMessages[formattedMessages.length - 1];
    const lastMessageText = lastMessage?.parts?.[0]?.text || "체형에 알맞은 코디 추천해주세요!";

    const response = await chat.sendMessage({
      message: lastMessageText,
    });

    return res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return res.status(500).json({
      reply: "IPTA 시스템 리커버리 모드: 현재 동시 요청자가 많아 일시적으로 에러가 발생했습니다. 잠시 후 질문을 입력해주시면 즉시 스타일 맵 검토를 재개하겠습니다."
    });
  }
});

// -------------------------------------------------------------
// Vite Express Serving Configuration
// -------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Serve using Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware integrated.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server route configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IPTA Virtual Fitting Server listening at http://localhost:${PORT}`);
  });
}

bootstrap();
