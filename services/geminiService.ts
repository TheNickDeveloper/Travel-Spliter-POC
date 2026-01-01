
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  /**
   * 使用 Gemini 解析收據圖片或文字，並返回結構化支出數據
   */
  async parseReceipt(content: { data: string; mimeType: string }) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        你是一個專業的財務分析專家。請仔細分析這張收據或發票圖片：
        1. 找出 總金額 (amount)，只要數字。
        2. 辨識 貨幣代碼 (currency)，例如 TWD, JPY, USD。如果沒寫，請根據收據語言推測（如繁體中文推測為 TWD）。
        3. 根據消費內容判斷 類別 (category)，必須是：'餐飲', '交通', '住宿', '購物', '娛樂', '其他' 之一。
        4. 提取 商店名稱或項目名稱，並將其轉化為簡短、準確的「繁體中文總結」作為 標題 (title)。例如：如果是日本 7-Eleven 收據，請標記為「7-11 便利商店」。
        5. 如果有地點資訊，請提取 地點 (location)。
        6. 辨識 收據日期 (date)，格式必須為 YYYY-MM-DD。
        
        請務必以純 JSON 格式回覆。
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: {
          parts: [
            { inlineData: content },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              category: { type: Type.STRING },
              title: { type: Type.STRING, description: 'Short summary in Traditional Chinese' },
              location: { type: Type.STRING },
              date: { type: Type.STRING, description: 'Format: YYYY-MM-DD' }
            },
            required: ["amount", "currency", "title", "date"]
          }
        }
      });

      const text = response.text;
      console.log("Gemini AI Full Response:", text);
      return JSON.parse(text || '{}');
    } catch (error) {
      console.error("Gemini Parse Error:", error);
      return null;
    }
  }
};
