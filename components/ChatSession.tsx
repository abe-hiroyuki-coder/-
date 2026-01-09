
import React, { useState, useRef, useEffect } from 'react';
import { Theme, ChatMessage } from '../types';
import { startChatStream, extractInsight } from '../services/geminiService';

interface ChatSessionProps {
  currentTheme: Theme | null;
  addInsight: (body: string, themeId: string, sessionId?: string) => void;
  persistedMessages: ChatMessage[];
  // Fix the type to allow functional updates
  setPersistedMessages: (update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  clearPersistedMessages: () => void;
}

const ChatSession: React.FC<ChatSessionProps> = ({ 
  currentTheme, 
  addInsight, 
  persistedMessages, 
  setPersistedMessages, 
  clearPersistedMessages 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [persistedMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !currentTheme || isLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input };
    const updatedMessages = [...persistedMessages, userMsg];
    setPersistedMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const modelMsgId = crypto.randomUUID();
      const modelMsg: ChatMessage = { id: modelMsgId, role: 'model', text: '' };
      setPersistedMessages([...updatedMessages, modelMsg]);

      let fullResponseText = '';
      const stream = startChatStream(currentTheme.name, currentTheme.goal, updatedMessages);
      
      for await (const chunk of stream) {
        fullResponseText += chunk;
        // Correctly typed functional update
        setPersistedMessages((prev: ChatMessage[]) => 
          prev.map(m => m.id === modelMsgId ? { ...m, text: fullResponseText } : m)
        );
      }
    } catch (error) {
      console.error("Chat Session Error:", error);
      // Correctly typed functional update for error handling
      setPersistedMessages((prev: ChatMessage[]) => [
        ...prev, 
        { id: crypto.randomUUID(), role: 'model', text: "すみません、少し考えがまとまりませんでした。もう一度お願いできますか？" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声入力に対応していません。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setInput(prev => (prev ? prev + ' ' : '') + event.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleExtract = async () => {
    if (!currentTheme || persistedMessages.length < 2 || isLoading) return;
    setIsLoading(true);
    try {
      const conversationText = persistedMessages
        .map(m => `${m.role === 'user' ? 'ユーザー' : '熟達っつぁん'}: ${m.text}`)
        .join('\n');
        
      const insights = await extractInsight(conversationText);
      if (insights.length > 0) {
        insights.forEach(insight => {
          addInsight(insight, currentTheme.id, sessionId.current);
        });
        alert(`${insights.length}件の気づきをログに記録しました。`);
      } else {
        alert("今回は新しい気づきを抽出できませんでした。もう少し対話を深めてみましょう。");
      }
    } catch (error) {
      console.error("Extraction Error:", error);
      alert("気づきの抽出に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentTheme) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <span className="text-4xl mb-4">🛶</span>
        <p className="font-bold">テーマを選択して対話を始めましょう</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <header className="p-4 bg-white border-b border-slate-100 shrink-0 flex justify-between items-center shadow-sm">
        <div className="overflow-hidden">
          <h2 className="text-lg font-black tracking-tight text-slate-900 truncate">{currentTheme.name}</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Deep Dialogue Session</p>
        </div>
        <button 
          onClick={() => { if(confirm("これまでの会話をリセットしますか？")) clearPersistedMessages(); }} 
          className="text-[10px] font-black text-slate-300 hover:text-red-400 transition-colors uppercase tracking-tighter shrink-0 ml-4"
        >
          Reset
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {persistedMessages.length === 0 && (
          <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100/50 text-indigo-900/60 text-sm font-medium leading-relaxed italic text-center animate-in fade-in zoom-in duration-500">
            「{currentTheme.goal}」に向けて、<br/>今感じていることや、ぶつかっている壁について<br/>自由に話してみてください。
          </div>
        )}
        {persistedMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-${msg.role === 'user' ? 'right' : 'left'}-4 duration-300`}
          >
            <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 shadow-md' 
                : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {isLoading && msg.role === 'model' && msg.text === '' && (
                <div className="flex gap-1 py-1">
                  <div className="w-1 h-1 bg-slate-200 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-slate-200 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1 h-1 bg-slate-200 rounded-full animate-bounce delay-150"></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 space-y-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {persistedMessages.length >= 2 && (
          <button 
            onClick={handleExtract}
            disabled={isLoading}
            className="w-full py-2.5 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100 active:scale-95 transition-all disabled:opacity-50 hover:bg-amber-100"
          >
            会話の中から「気づき」を抽出 💡
          </button>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="思い浮かんだことを入力..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button 
            type="button" 
            onClick={startVoiceInput} 
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            🎤
          </button>
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-30 active:scale-90 transition-transform shrink-0"
          >
            🏹
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSession;
