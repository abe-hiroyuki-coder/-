import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// 安全に環境変数を取得するヘルパー
const getApiKey = () => {
  try {
    return (globalThis as any).process?.env?.API_KEY || '';
  } catch {
    return '';
  }
};

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
 */
export async function* startChatStream(themeName: string, goal: string, history: { role: 'user' | 'model', text: string }[]) {
  const apiKey = getApiKey();
  if (!apiKey) {
    yield "APIキーが設定されていません。環境変数をご確認ください。";
    return;
  }

  // 最新のAPIキーを使用してインスタンスを作成（トップレベルでのエラーを回避）
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  
  const chatHistory = history.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n現在のテーマ: ${themeName}\n最終目標: ${goal}`,
    },
    history: chatHistory,
  });

  const lastMessage = history[history.length - 1]?.text || "セッションを開始しましょう。";
  
  try {
    const response = await chat.sendMessageStream({ message: lastMessage });
    for await (const chunk of response) {
      const c = chunk as GenerateContentResponse;
      yield c.text || "";
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    yield "申し訳ありません、通信中にエラーが発生しました。";
  }
}

/**
 * 会話内容から要点を抽出して「気づき」のリストを作成します。
 */
export async function extractInsight(text: string): Promise<string[]> {
  const apiKey = getApiKey();
  if (!apiKey) return ["APIキーが設定されていません。"];

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `以下の会話から、ユーザーが得た重要な「気づき」や「次の一手」を短文で抽出してください。\n\n会話：\n${text}`,
      config: {
        systemInstruction: "箇条書きで、核心を突いた短い一文に整形してください。余計な解説は不要です。",
      }
    });
    
    const result = response.text || "";
    return result.split('\n').map(s => s.replace(/^[・-]\s*/, '').trim()).filter(Boolean);
  } catch (error) {
    console.error("Gemini Extract Error:", error);
    return ["気づきの抽出に失敗しました。"];
  }
}