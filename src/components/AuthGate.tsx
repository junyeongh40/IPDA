import React, { useState } from "react";
import { Sparkles, Check, ArrowRight, UserPlus, LogIn, ShieldCheck } from "lucide-react";

interface UserProfile {
  username: string;
  name: string;
  genderPref: "male" | "female" | "unisex";
}

interface AuthGateProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AuthGate({ onLoginSuccess }: AuthGateProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [genderPref, setGenderPref] = useState<"male" | "female" | "unisex">("unisex");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!username || !password || !name) {
      setErrorMsg("모든 필드를 기입해 주세요.");
      return;
    }

    if (username.length < 3) {
      setErrorMsg("ID는 3자 이상이어야 합니다.");
      return;
    }

    if (password.length < 4) {
      setErrorMsg("비밀번호는 4자 이상이어야 합니다.");
      return;
    }

    // Get current users DB from localStorage
    const savedUsersStr = localStorage.getItem("ipda_local_users") || "[]";
    const usersList: Array<UserProfile & { password: string }> = JSON.parse(savedUsersStr);

    // Duplication check
    const userExists = usersList.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      setErrorMsg("이미 사용 중인 ID입니다.");
      return;
    }

    // Save user
    const newUser = { username, password, name, genderPref };
    usersList.push(newUser);
    localStorage.setItem("ipda_local_users", JSON.stringify(usersList));

    setSuccessMsg("🎉 회원가입이 성공적으로 완료되었습니다! 로그인 탭에서 로그인해 주세요.");
    // Clear registration inputs
    setPassword("");
    
    // Auto-switch to login tab after 1.5 seconds or immediately
    setTimeout(() => {
      setIsLoginTab(true);
      setErrorMsg("");
    }, 1200);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username || !password) {
      setErrorMsg("ID와 비밀번호를 기입해 주세요.");
      return;
    }

    // Pre-seeded test account for convenience
    if (username === "ipda" && password === "1234") {
      const demoUser: UserProfile = { username: "ipda", name: "홍길동", genderPref: "unisex" };
      onLoginSuccess(demoUser);
      return;
    }

    const savedUsersStr = localStorage.getItem("ipda_local_users") || "[]";
    const usersList: Array<UserProfile & { password: string }> = JSON.parse(savedUsersStr);

    const matchedUser = usersList.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!matchedUser) {
      setErrorMsg("아이디 또는 비밀번호가 올바르지 않습니다. (테스트용 계정 ID: ipda / 비밀번호: 1234)");
      return;
    }

    onLoginSuccess({
      username: matchedUser.username,
      name: matchedUser.name,
      genderPref: matchedUser.genderPref
    });
  };

  const handleGuestAdmission = () => {
    onLoginSuccess({
      username: "guest_" + Math.floor(Math.random() * 1000),
      name: "체험 회원",
      genderPref: "unisex"
    });
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 bg-white animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-black rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Subtle decorative banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black" />

        {/* Brand logo */}
        <div className="text-center mb-6">
          <div className="inline-flex px-5 py-2 rounded-xl bg-black border-2 border-black items-center justify-center font-black text-white tracking-[0.25em] text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-stone-900 transition-colors duration-300 mb-3 mx-auto">
            입다
          </div>
          <h2 className="text-xl font-black tracking-tight text-black">IPDA 3D 가상 피팅 스튜디오</h2>
          <p className="text-stone-500 text-[11px] mt-1 font-semibold">
            가상 옷방 연동 및 AI 정밀 체형 시뮬레이션
          </p>
        </div>

        {/* Tab Selector - Minimal High Contrast */}
        <div className="grid grid-cols-2 border-2 border-black rounded-xl overflow-hidden mb-6.5">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              isLoginTab ? "bg-black text-white" : "bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              !isLoginTab ? "bg-black text-white" : "bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-stone-50 border border-black rounded-xl text-xs text-red-600 font-bold leading-relaxed">
            ⚠ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-stone-50 border border-black rounded-xl text-xs text-green-700 font-bold leading-relaxed">
            {successMsg}
          </div>
        )}

        {/* Authorization Forms */}
        {isLoginTab ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-black uppercase tracking-wider block">아이디 (ID)</label>
              <input
                type="text"
                placeholder="ID를 입력해 주세요 (예: ipda)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white text-black border-2 border-black rounded-xl px-3.5 py-2.5 text-xs placeholder:text-stone-400 font-medium focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-black uppercase tracking-wider block">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력해 주세요 (예: 1234)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white text-black border-2 border-black rounded-xl px-3.5 py-2.5 text-xs placeholder:text-stone-400 font-medium focus:outline-none focus:ring-0"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-stone-900 border-2 border-black text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <LogIn className="w-3.5 h-3.5" />
              로그인하고 피팅 시작하기
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-black uppercase tracking-wider block">사용할 아이디</label>
              <input
                type="text"
                placeholder="3자 이상의 아이디를 정해 주세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white text-black border-2 border-black rounded-xl px-3.5 py-2.5 text-xs placeholder:text-stone-400 font-medium focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-black uppercase tracking-wider block">성함 / 닉네임</label>
              <input
                type="text"
                placeholder="회원님의 실명 또는 별칭"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white text-black border-2 border-black rounded-xl px-3.5 py-2.5 text-xs placeholder:text-stone-400 font-medium focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-black uppercase tracking-wider block">비밀번호</label>
              <input
                type="password"
                placeholder="4자 이상의 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white text-black border-2 border-black rounded-xl px-3.5 py-2.5 text-xs placeholder:text-stone-400 font-medium focus:outline-none focus:ring-0"
              />
            </div>

            {/* Gender recommendation personalization */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-black uppercase tracking-wider block">선호 성별 체형</label>
              <div className="grid grid-cols-3 gap-2">
                {(["male", "female", "unisex"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderPref(g)}
                    className={`py-1.5 text-[10px] font-bold rounded-lg border-2 transition-all cursor-pointer ${
                      genderPref === g
                        ? "bg-black text-white border-black"
                        : "bg-white text-stone-600 border-stone-200 hover:border-black"
                    }`}
                  >
                    {g === "male" ? "남성" : g === "female" ? "여성" : "공용"}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-stone-900 border-2 border-black text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <UserPlus className="w-3.5 h-3.5" />
              신규 가입 완료하기
            </button>
          </form>
        )}

        {/* Separator */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-stone-400 font-bold uppercase tracking-widest">or</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* Guest access option */}
        <button
          onClick={handleGuestAdmission}
          className="w-full bg-white hover:bg-stone-50 text-black font-black border-2 border-black text-xs py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>🔐 테스트 계정 자동 우회 & 바로 체험하기</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Helpful pre-seed credential hint */}
        <div className="mt-5 border border-dashed border-stone-200 rounded-xl p-3 bg-stone-50 text-center text-[10px] text-stone-500 leading-normal">
          <p className="font-bold text-stone-700">💡 즉시 테스트용 로그인 계정 정보</p>
          <p className="mt-0.5">아이디: <span className="font-black text-black select-all">ipda</span> | 비밀번호: <span className="font-black text-black select-all">1234</span></p>
        </div>
      </div>
    </div>
  );
}
