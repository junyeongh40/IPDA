import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, UserMeasurements } from "../types";
import { Send, Sparkles, RefreshCw, Loader2 } from "lucide-react";

interface StyleChatProps {
  measurements: UserMeasurements;
  activeOutfitName: string | null;
}

export default function StyleChat({ measurements, activeOutfitName }: StyleChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestionTags = [
    "어울리는 실루엣 추천해줘",
    activeOutfitName ? `${activeOutfitName} 코디 코멘트 해줘` : "이 체형의 단점 커버하는 법",
    "허리 대비 넓은 골반/어깨 매칭 팁",
    "이 체형에 베스트 아우터 가이드",
  ];

  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: "welcome-msg",
      role: "assistant",
      content: `반갑습니다! IPDA AI 전담 스타일 디렉터입니다. 
현재 설정된 체형 프로필(키 ${measurements.height}cm, 체중 ${measurements.weight}kg, 허리 ${measurements.waistSize}인치)을 면밀히 분석한 스타일 매칭 서비스를 전수해 드립니다. 
질문하고 싶으신 피팅 애로사항이나 선호 스타일링(컬러 매칭, 소재 등)에 대해 편하게 메시지를 남겨 주세요!`,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  }, [measurements.height, measurements.weight, measurements.waistSize]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setSending(true);

    try {
      const threadContext = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/fitting/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: threadContext,
          measurements: measurements,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat service failed");
      }

      const data = await res.json();

      const coachResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "죄송합니다. 현재 바디 데이터 연결 상태가 원활하지 않습니다.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, coachResponse]);
    } catch (err) {
      console.error(err);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "스타일 코치 데이터 피드가 일시적으로 혼잡합니다. 잠시만 기다리셨다가 다시 말씀해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setSending(false);
    }
  };

  const handleResetChat = () => {
    const welcomeMsg: ChatMessage = {
      id: "welcome-reset",
      role: "assistant",
      content: "스타일 상담 피드가 리셋되었습니다. 추가적으로 코디하고 싶으신 매칭법이나 체형 보완법에 대해 물어보세요!",
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  };

  return (
    <div className="flex flex-col bg-white border-2 border-black rounded-3xl p-5 h-[460px] md:h-[520px] w-full shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-text">
      {/* Consultant Header */}
      <div className="flex items-center justify-between border-b border-black pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-stone-100 border border-black flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black animate-pulse" />
          </div>
          <div>
            <h4 className="text-black text-xs font-black tracking-wider uppercase">IPDA AI 스타일 코치</h4>
            <span className="text-[9px] text-cyan-600 font-bold">인공지능 정밀 가상 피팅 룸</span>
          </div>
        </div>
        <button
          onClick={handleResetChat}
          className="px-2.5 py-1 bg-stone-50 hover:bg-black hover:text-white border border-black rounded-lg transition-colors text-black text-xs flex items-center gap-1 font-mono font-bold cursor-pointer"
          title="Restart Conversation"
        >
          <RefreshCw className="w-3" />
          리셋
        </button>
      </div>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-stone-250 scrollbar-track-transparent">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex flex-col max-w-[85%] ${
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm break-words ${
                  isUser
                    ? "bg-black text-white font-medium rounded-tr-none font-sans"
                    : "bg-stone-100 text-black border border-stone-300 rounded-tl-none font-sans"
                }`}
              >
                {message.content.split("\n").map((line, i) => (
                  <p key={i} className="mb-0.5 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
              <span className="text-[9px] text-stone-500 font-mono mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}

        {sending && (
          <div className="mr-auto items-start flex flex-col max-w-[85%]">
            <div className="p-3 bg-stone-50 text-stone-600 border border-stone-200 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
              <span className="text-xs font-mono font-bold">컨설턴트 작성 중...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Option Tags */}
      {messages.length === 1 && !sending && (
        <div className="py-2.5 shrink-0">
          <p className="text-[9px] font-mono font-bold text-stone-500 mb-1.5 uppercase tracking-widest px-0.5">추천 질문 키워드</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestionTags.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(tag)}
                className="text-[11px] text-stone-700 bg-stone-50 border border-stone-300 hover:border-black hover:text-black hover:bg-stone-50 rounded-xl px-2.5 py-1 text-left transition-all active:scale-95 duration-200 cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="mt-3 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="스타일 코치에게 피팅 고민 질문하기..."
          className="flex-1 bg-stone-50 text-black rounded-xl px-4 py-2 border-2 border-black focus:outline-none focus:ring-1 focus:ring-black placeholder-stone-400 font-sans text-xs transition-all"
          disabled={sending}
        />
        <button
          type="submit"
          className="bg-black hover:bg-stone-800 text-white font-extrabold rounded-xl px-4 transition-all disabled:opacity-50 active:scale-95 shrink-0 flex items-center justify-center cursor-pointer shadow"
          disabled={sending || !inputText.trim()}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
