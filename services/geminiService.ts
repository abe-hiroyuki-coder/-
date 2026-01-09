
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Always use named parameter for apiKey and direct process.env.API_KEY access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
あなたは「熟達っつぁん」というアプリの壁打ちパートナーです。
ユーザーが自身の特定のテーマ（例：英語、プログラミング、ピアノ等）について深く考え、気づきを得るのを支援します。

【振る舞いルール】
1. 受け取る → 要約する：ユーザーの発言を肯定的に受け止め、要点を短くまとめます。
2. 深掘りの問い：ユーザーが自分で答えを見つけられるよう、1つだけ鋭い問いを投げかけます。
3. ヒントは控えめに：正解を教えるのではなく「〜という視点もあるかもしれません」と可能性を添える程度にします。
4. 結論を急がせない：ユーザーの思考プロセスそのものを大切にします。
5. 目標再確認：時折、そもそも何を達成したかったのか、初心に帰る問いを混ぜます。

【出力形式】
親しみやすく、かつ知的な「熟練の師匠」のような口調で話してください。
`;

/**
 * チャットセッションを開始し、レスポンスをストリームで返します。
 * 履歴を渡すことで、会話のコンテキストを維持します。
 */
export async function* startChatStream(themeName: string, goal: string, history: { role: 'user' | 'model', text: string }[]) {
  // Use gemini-3-flash-preview for basic conversation tasks
  const model = 'gemini-3-flash-preview';
  
  // Convert existing messages to the required parts format, excluding the most recent user message
  const chatHistory = history.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n現在のテーマ: ${themeName}\n最終目標: ${goal}`,
    },
    // Populate chat history to maintain conversation flow
    history: chatHistory,
  });

  // The last message in history is the current prompt
  const lastMessage = history[history.length - 1]?.text || "セッションを開始しましょう。";
  
  // Use sendMessageStream which only accepts the message parameter
  const response = await chat.sendMessageStream({ message: lastMessage });
  
  for await (const chunk of response) {
    // GenerateContentResponse features a text property, not a method
    const c = chunk as GenerateContentResponse;
    yield c.text || "";
  }
}

/**
 * 会話内容から要点を抽出して「気づき」のリストを作成します。
 */
export async function extractInsight(text: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `以下の会話から、ユーザーが得た重要な「気づき」や「次の一手」を短文で抽出してください。\n\n会話：\n${text}`,
    config: {
      systemInstruction: "箇条書きで、核心を突いた短い一文に整形してください。余計な解説は不要です。",
    }
  });
  
  // response.text is a property
  const result = response.text || "";
  return result.split('\n').map(s => s.replace(/^[・-]\s*/, '').trim()).filter(Boolean);
}
