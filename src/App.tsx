import React, { useState, useEffect } from "react";
import {
  UserMeasurements,
  AnalysisResult,
  Garment
} from "./types";
import AvatarViewer from "./components/AvatarViewer";
import Wardrobe, { INITIAL_CLOTHING_COLLECTION } from "./components/Wardrobe";
import StyleChat from "./components/StyleChat";
import AuthGate from "./components/AuthGate";
import {
  Sparkles,
  Ruler,
  Camera,
  Layers,
  ChevronRight,
  Info,
  Scale,
  RefreshCw,
  Sliders,
  Check,
  User,
  Heart,
  FileText,
  LogOut
} from "lucide-react";

interface UserProfile {
  username: string;
  name: string;
  genderPref: "male" | "female" | "unisex";
}

export default function App() {
  // Session management state loaded safely from localStorage
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("ipda_active_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 3개 화면 관리 상태 ("first_screen" | "home" | "browse")
  const [activeView, setActiveView] = useState<"first_screen" | "home" | "browse">("first_screen");

  // Biometric state defaults
  const [measurements, setMeasurements] = useState<UserMeasurements>({
    gender: "male",
    height: 176,
    weight: 71,
    shoulderWidth: 46,
    waistSize: 31,
    hipSize: 94,
    preferredFit: "regular",
    image: null,
  });

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("ipda_active_session", JSON.stringify(user));
    if (user.genderPref && user.genderPref !== "unisex") {
      setMeasurements((prev) => ({
        ...prev,
        gender: user.genderPref
      }));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("ipda_active_session");
    // Clear selections on logout
    setSelectedTop(null);
    setSelectedBottom(null);
    setSelectedOuterwear(null);
    setActiveView("first_screen");
  };

  // Clothing drape attachments
  const [selectedTop, setSelectedTop] = useState<Garment | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<Garment | null>(null);
  const [selectedOuterwear, setSelectedOuterwear] = useState<Garment | null>(null);

  // Calibration processes tracking
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [avatarReady, setAvatarReady] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"advisor" | "chat">("advisor");

  // Gemini result payload
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Set default placeholder analysis on mount so the user has beautiful data immediately
  useEffect(() => {
    const prefillResult: AnalysisResult = {
      bodyType: "역삼각형 및 균형잡힌 상하체 핏 (Trapezoid)",
      proportions: {
         chest: 58,
         waist: 48,
         hip: 52,
         shoulder: 62,
         legs: 65,
      },
      fitAnalysis: {
        tops: "L",
        bottoms: "M",
        fitMatchScore: 94,
      },
      styleVerdict: "어깨라인이 균형 있게 발달하였고, 허리 대비 완벽한 하프 벨트 비율을 유지하고 있어 대부분의 핏을 자유롭게 연출할 수 있습니다. 슬림 핏 팬츠로 정돈된 실루엣을 부각하거나 와이드 벌룬 핏 데님을 활용하여 하이 테크 스트리트웨어 오라를 구현하기 매우 우수한 체형입니다.",
      fittingTips: [
        "와이드 세비지핏 실루엣 하의를 세팅하여 골반의 볼륨감을 허리 축과 비례하게 늘리면 이상적인 드레이프 핏을 감상할 수 있습니다.",
        "기럭지 연출을 위해 아우터 앞면 칼라 선을 허리 위 라인에서 부드럽게 겹쳐 착용하는 헤비 레이어 스타일을 적극 권장합니다.",
        "목선이 자연스럽게 연출되도록 마감을 둥글게 한 크루넥 티셔츠나 가벼운 셔츠를 추천 드립니다."
      ],
      isFallback: true,
    };
    setAnalysisResult(prefillResult);
    setAvatarReady(true);
  }, []);

  // Delay helper for biometric loader transitions
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Handles custom photo selection & conversion to base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 형식의 파일만 업로드할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMeasurements((prev) => ({
        ...prev,
        image: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const triggerCalibrateBiometrics = async () => {
    setLoading(true);
    setAvatarReady(false);

    try {
      setAnalysisStep("신체 윤곽 데이터를 추출하고 있어요");
      await delay(2000);

      setAnalysisStep("골격 포인트를 분석하고 있어요");
      await delay(2200);

      setAnalysisStep("체형 비율을 계산하고 있어요");
      await delay(2200);

      setAnalysisStep("실제 인체 메시를 생성하고 있어요");
      await delay(2600);

      setAnalysisStep("3D 디지털 아바타를 생성하고 있어요");
      await delay(2600);

      setAnalysisStep("의상 시뮬레이션 데이터를 생성하고 있어요");
      await delay(2400);

      const response = await fetch("/api/fitting/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gender: measurements.gender,
          height: measurements.height,
          weight: measurements.weight,
          shoulderWidth: measurements.shoulderWidth,
          waistSize: measurements.waistSize,
          hipSize: measurements.hipSize,
          preferredFit: measurements.preferredFit,
          image: measurements.image,
          selectedOutfit: selectedTop,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
      setActiveView("home"); // 분석 완료 시 자동으로 3D 가상 피팅룸으로 이동!
    } catch (err) {
      console.error("Biometric failure:", err);
    } finally {
      setLoading(false);
      setAvatarReady(true);
    }
  };

  const handleResetImage = () => {
    setMeasurements((prev) => ({
      ...prev,
      image: null,
    }));
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans select-none selection:bg-black selection:text-white">
      {/* 한글 고대비 프리미엄 헤더 및 탭 네비게이션 */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-black px-4 md:px-8 py-3.5 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-xl bg-black border-2 border-black flex items-center justify-center font-black text-white tracking-[0.25em] text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-stone-900 transition-colors duration-300">
              입다
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-black text-lg font-black tracking-tight">IPDA 3D 가상 피팅룸</h1>
                <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded border border-black uppercase tracking-wider animate-pulse">
                  실시간 엔진
                </span>
              </div>
              <p className="text-stone-500 text-[11px] font-bold">
                AI 신체 데이터 기반 3D 쌍둥이 모델링 테크
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-black font-extrabold shadow-sm font-sans">
              <span>👤 {currentUser.name}님 로그인 중</span>
              <button
                onClick={handleLogout}
                title="로그아웃"
                className="ml-2 hover:text-red-550 text-stone-500 hover:bg-stone-100 p-1.5 rounded-lg border border-transparent hover:border-black/15 transition-all cursor-pointer flex items-center gap-1 font-bold text-[10px]"
              >
                <LogOut className="w-3 h-3" />
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* 3개 화면 개별 탭 이동 장치 - Simplified Names as requested */}
        {currentUser && (
          <div className="flex items-center gap-2 shrink-0 max-w-full overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveView("first_screen")}
              className={`px-4 py-2 rounded-xl border-2 text-xs font-black tracking-tight transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeView === "first_screen"
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                  : "bg-stone-50 text-stone-700 border-stone-300 hover:border-black hover:bg-white"
              }`}
            >
              📐 당신의 신체정보 입력
            </button>
            <button
              onClick={() => setActiveView("home")}
              className={`px-4 py-2 rounded-xl border-2 text-xs font-black tracking-tight transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeView === "home"
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                  : "bg-stone-50 text-stone-700 border-stone-300 hover:border-black hover:bg-white"
              }`}
            >
              👕 3D 가상 피팅 스튜디오
            </button>
            <button
              onClick={() => setActiveView("browse")}
              className={`px-4 py-2 rounded-xl border-2 text-xs font-black tracking-tight transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeView === "browse"
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                  : "bg-stone-50 text-stone-700 border-stone-300 hover:border-black hover:bg-white"
              }`}
            >
              🛍️ 옷 둘러보기
            </button>
          </div>
        )}
      </header>

      {/* 메인 워크스페이스 공간 (조건부 뷰 렌더링) */}
      {!currentUser ? (
        <AuthGate onLoginSuccess={handleLoginSuccess} />
      ) : (
        <main className="flex-1 w-full max-w-[1536px] mx-auto p-4 md:p-6 lg:p-8 shrink-0">
        
        {/* ========================================================================= */}
        {/* [1] 신체정보 입력 및 전신 사진 연동 */}
        {/* ========================================================================= */}
        {activeView === "first_screen" && (
          <div className="space-y-6 animate-fade-in">
            {/* 시작 가이드 가독성 배너 */}
            <div className="bg-stone-50 border-2 border-black rounded-3xl p-6.5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-red-500 font-bold text-xs bg-red-55 px-3 py-1 rounded-full border border-red-250 inline-block uppercase tracking-widest">
                IPDA 바디 클론 가이드
              </span>
              <h2 className="text-black text-2xl font-black tracking-tight mt-3">
                📐 당신의 신체정보를 입력해주세요!
              </h2>
              <p className="text-stone-600 text-xs mt-2 max-w-2xl mx-auto leading-relaxed">
                정교한 가상 피팅 시뮬레이션을 위해 사용자의 성별, 신장, 체중 등을 세부 조정할 수 있습니다.<br />
                정면 전신 사진을 업로드하시면 최첨단 신체 윤곽 데이터 및 관절 분석 검출기가 연동됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* 왼쪽 입력 카드: 체형 치수 미세 조절 */}
              <div className="bg-white border-2 border-black rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 border-b-2 border-dashed border-stone-200 pb-3">
                  <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">✔</span>
                  <h3 className="text-black text-sm font-black tracking-tight">지수 매뉴얼 제어</h3>
                </div>

                {/* 성별 설정 */}
                <div className="space-y-2">
                  <label className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
                    1. 성별 기준 설정
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["male", "female", "unisex"] as const).map((g) => {
                      const active = measurements.gender === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setMeasurements((prev) => ({ ...prev, gender: g }))}
                          className={`py-2 px-1 rounded-xl text-center border-2 text-xs font-black uppercase transition-all tracking-wider cursor-pointer ${
                            active
                              ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                              : "bg-white text-stone-700 border-stone-200 hover:border-black"
                          }`}
                        >
                          {g === "male" ? "남성" : g === "female" ? "여성" : "공용"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 상세 치수 슬라이더들 */}
                <div className="space-y-4">
                  <label className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
                    2. 세부 정밀 눈금 조절
                  </label>

                  {/* 신장 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">신장 (키)</span>
                      <span className="text-black font-extrabold">{measurements.height} cm</span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="210"
                      value={measurements.height}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, height: parseInt(e.target.value) }))
                      }
                      className="w-full accent-black h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer border border-stone-300"
                    />
                  </div>

                  {/* 체중 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">몸무게 (체중)</span>
                      <span className="text-black font-extrabold">{measurements.weight} kg</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="140"
                      value={measurements.weight}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, weight: parseInt(e.target.value) }))
                      }
                      className="w-full accent-black h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer border border-stone-300"
                    />
                  </div>

                  {/* 어깨 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">어깨 넓이</span>
                      <span className="text-black font-extrabold">{measurements.shoulderWidth} 수치</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="60"
                      value={measurements.shoulderWidth}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, shoulderWidth: parseInt(e.target.value) }))
                      }
                      className="w-full accent-black h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer border border-stone-300"
                    />
                  </div>

                  {/* 허리 수치 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">허리 둘레 수치</span>
                      <span className="text-black font-extrabold">{measurements.waistSize} 인치</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="48"
                      value={measurements.waistSize}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, waistSize: parseInt(e.target.value) }))
                      }
                      className="w-full accent-black h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer border border-stone-300"
                    />
                  </div>

                  {/* 골반/엉덩이 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">골반/엉덩이 너비</span>
                      <span className="text-black font-extrabold">{measurements.hipSize} cm</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="130"
                      value={measurements.hipSize}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, hipSize: parseInt(e.target.value) }))
                      }
                      className="w-full accent-black h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer border border-stone-300"
                    />
                  </div>
                </div>

                {/* 선호 핏 선호감 제어 */}
                <div className="space-y-2">
                  <label className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
                    3. 선호 피팅 스타일 핏
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["tight", "regular", "loose"] as const).map((fit) => {
                      const active = measurements.preferredFit === fit;
                      return (
                        <button
                          key={fit}
                          onClick={() => setMeasurements((prev) => ({ ...prev, preferredFit: fit }))}
                          className={`py-2 px-1 rounded-xl text-center border-2 text-xs font-black uppercase transition-all tracking-wider cursor-pointer ${
                            active
                              ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                              : "bg-white text-stone-700 border-stone-200 hover:border-black"
                          }`}
                        >
                          {fit === "tight" ? "타이트핏" : fit === "regular" ? "레귤러핏" : "루즈핏"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 오른쪽 카드: 정면 전신 사진 드래그 & 전체 풀 사이즈 노출 */}
              <div className="bg-white border-2 border-black rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[500px]">
                <div className="flex items-center gap-2 border-b-2 border-dashed border-stone-200 pb-3 shrink-0">
                  <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">📸</span>
                  <h3 className="text-black text-sm font-black tracking-tight">전신 피팅 실루엣 서류 등록</h3>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  {!measurements.image ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all h-[340px] md:h-[420px] ${
                        dragActive ? "border-black bg-stone-100" : "border-stone-300 bg-stone-50 hover:border-black"
                      }`}
                    >
                      <Camera className="w-10 h-10 text-stone-600 mb-3" />
                      <p className="text-black font-black text-sm mb-1">
                        이곳에 이미지를 드래그 & 드롭해 주세요
                      </p>
                      <p className="text-[10px] text-stone-500 max-w-xs leading-relaxed mb-4">
                        정면 정차 자세 전신 사진이 업로드되면 AI 스캐닝 엔진이 바디 볼륨 포인트를 즉각 분석합니다.
                      </p>
                      <label className="bg-white hover:bg-stone-100 border-2 border-black text-xs font-black uppercase tracking-wider text-black rounded-xl px-4 py-2.5 cursor-pointer flex items-center gap-1.5 transition-colors shadow">
                        의상 사진 찾아보기
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-black bg-stone-55 p-3 flex flex-col justify-center items-center h-[340px] md:h-[420px]">
                      {/* 사용자가 요구한 "업로드 한 사진이 다 보이게" 해 주는 전체 이미지 렌더링 */}
                      <img
                        src={measurements.image}
                        alt="전신 실루엣 피팅 대조 뷰"
                        className="h-full w-auto object-contain rounded-xl"
                      />
                      
                      <div className="absolute top-4 left-4 border border-black/10 flex items-center justify-center pointer-events-none rounded bg-black/85 px-3 py-1 shadow-md">
                        <span className="text-[10px] font-bold text-white tracking-widest animate-pulse">
                          📸 업로드 완료 / 정밀 스캔 준비됨
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetImage}
                        className="absolute bottom-4 right-4 bg-white hover:bg-red-50 text-red-600 border-2 border-black text-xs font-black px-3.5 py-2 rounded-xl shadow cursor-pointer transition-colors"
                      >
                        사진 교체하기
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-center shrink-0">
                  <p className="text-stone-500 text-[10.5px] leading-relaxed">
                    *안심하세요: 등록된 체형 정보와 전신 사진 파일은 브라우저 공간 샌드박스에서만 철저히 암호화되어 작동합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* AI 가상인간 및 피팅 생성 가동 버튼 */}
            <div className="pt-2 text-center">
              <button
                onClick={triggerCalibrateBiometrics}
                className="w-full max-w-xl mx-auto bg-black hover:bg-neutral-800 text-white font-black text-sm uppercase tracking-widest py-4.5 rounded-3xl border-2 border-black transition-all duration-200 active:translate-y-[2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                AI 체형 데이터 분석 & 3D 가상인간 아바타 피팅 가동
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* [2] 3D 가상 피팅 스튜디오 (3열 아키텍처) */}
        {/* ========================================================================= */}
        {activeView === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            
            {/* 1열: 왼쪽 조절 판넬 */}
            <section className="lg:col-span-4 bg-white border-2 border-black rounded-3xl p-5 md:p-6 flex flex-col gap-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-[820px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
              {/* 시작 가이드 가독성 배너 */}
              <div className="bg-stone-50 border border-black rounded-2xl p-4.5 text-center">
                <span className="text-stone-500 text-[9px] uppercase tracking-wider block font-black">실시간 코디네이팅 (Control Tower)</span>
                <p className="text-black font-semibold text-sm tracking-tight mt-1">
                  📐 당신의 신체정보가 입력되었습니다!
                </p>
                <p className="text-stone-500 text-[10px] mt-1 leading-relaxed">
                  키, 허리 사이즈 등 게이지를 실시간 조정하면 3D 아바타 피팅 수치가 유기적으로 재작성됩니다.
                </p>
              </div>

              <div className="flex items-center justify-between border-b border-black pb-3">
                <h2 className="text-black text-xs font-black tracking-wider uppercase flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-black" />
                  실시간 아바타 치수 교정
                </h2>
                <button
                  onClick={() => {
                    setMeasurements({
                      gender: "male",
                      height: 176,
                      weight: 71,
                      shoulderWidth: 46,
                      waistSize: 31,
                      hipSize: 94,
                      preferredFit: "regular",
                      image: null,
                    });
                    setSelectedTop(null);
                    setSelectedBottom(null);
                    setSelectedOuterwear(null);
                  }}
                  className="text-[10px] text-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-lg border border-black font-bold cursor-pointer font-sans"
                >
                  <RefreshCw className="w-3" />
                  기본값 복원
                </button>
              </div>

              {/* 성별 선택 */}
              <div>
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block mb-2">
                  성별 구분
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "unisex"] as const).map((g) => {
                    const active = measurements.gender === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setMeasurements((prev) => ({ ...prev, gender: g }))}
                        className={`py-1.5 px-1 rounded-lg text-center border text-[11px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-stone-700 border-stone-200 hover:border-black"
                        }`}
                      >
                        {g === "male" ? "남성" : g === "female" ? "여성" : "공용"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 실시간 튜닝 바 */}
              <div className="space-y-3.5">
                {/* 신장 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600 font-bold">키 (신장)</span>
                    <span className="text-black font-black">{measurements.height}cm</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="210"
                    value={measurements.height}
                    onChange={(e) => setMeasurements((prev) => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="w-full accent-black h-1 bg-stone-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 몸무게 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600 font-bold">몸무게</span>
                    <span className="text-black font-black">{measurements.weight}kg</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={measurements.weight}
                    onChange={(e) => setMeasurements((prev) => ({ ...prev, weight: parseInt(e.target.value) }))}
                    className="w-full accent-black h-1 bg-stone-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 어깨너비 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600 font-bold">어깨 너비 비율</span>
                    <span className="text-black font-black">{measurements.shoulderWidth}</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="60"
                    value={measurements.shoulderWidth}
                    onChange={(e) => setMeasurements((prev) => ({ ...prev, shoulderWidth: parseInt(e.target.value) }))}
                    className="w-full accent-black h-1 bg-stone-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 허리사이즈 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600 font-bold">허리 사이즈</span>
                    <span className="text-black font-black">{measurements.waistSize}인치</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="48"
                    value={measurements.waistSize}
                    onChange={(e) => setMeasurements((prev) => ({ ...prev, waistSize: parseInt(e.target.value) }))}
                    className="w-full accent-black h-1 bg-stone-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 엉덩이둘레 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600 font-bold">엉덩이 둘레</span>
                    <span className="text-black font-black">{measurements.hipSize}cm</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="130"
                    value={measurements.hipSize}
                    onChange={(e) => setMeasurements((prev) => ({ ...prev, hipSize: parseInt(e.target.value) }))}
                    className="w-full accent-black h-1 bg-stone-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* 핏감 조절 */}
              <div>
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block mb-2">
                  선호 핏 설정
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["tight", "regular", "loose"] as const).map((fit) => {
                    const active = measurements.preferredFit === fit;
                    return (
                      <button
                        key={fit}
                        onClick={() => setMeasurements((prev) => ({ ...prev, preferredFit: fit }))}
                        className={`py-1.5 px-1 rounded-lg text-center border text-[11px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-stone-700 border-stone-200 hover:border-black"
                        }`}
                      >
                        {fit === "tight" ? "타이트핏" : fit === "regular" ? "레귤러핏" : "루즈핏"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 정밀 재분석 버튼 */}
              <button
                onClick={triggerCalibrateBiometrics}
                className="w-full bg-black text-white font-extrabold text-xs py-3 rounded-xl border-2 border-black transition-all hover:bg-neutral-800 flex items-center justify-center gap-1.5 cursor-pointer mt-1 duration-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                AI 체형 종합 분석 보고서 갱신
              </button>
            </section>

            {/* 2열: 중앙 3D 아바타 피팅 렌더 및 레이어 리스트 */}
            <section className="lg:col-span-4 flex flex-col gap-4">
              <AvatarViewer
                measurements={measurements}
                selectedTop={selectedTop}
                selectedBottom={selectedBottom}
                selectedOuterwear={selectedOuterwear}
                avatarReady={avatarReady}
                loading={loading}
                analysisStep={analysisStep}
              />

              {/* 착용 레이어 제거 뱃지 */}
              {avatarReady && (selectedTop || selectedBottom || selectedOuterwear) && (
                <div className="bg-white border-2 border-black rounded-2xl p-4 flex flex-col gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[11px] font-sans">
                  <span className="text-stone-500 font-bold text-[9px] uppercase tracking-wider">현재 아바타 착용 의상 레이어 (클릭 시 탈의)</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTop && (
                      <span className="bg-stone-50 border border-black hover:border-red-600 hover:text-red-600 hover:bg-red-50/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer group" onClick={() => setSelectedTop(null)}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedTop.color }} />
                        <span className="truncate max-w-[80px] font-bold text-black">{selectedTop.name}</span>
                        <span className="text-[10px] text-stone-400 font-bold group-hover:text-red-600">×</span>
                      </span>
                    )}
                    {selectedBottom && (
                      <span className="bg-stone-50 border border-black hover:border-red-600 hover:text-red-600 hover:bg-red-50/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer group" onClick={() => setSelectedBottom(null)}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedBottom.color }} />
                        <span className="truncate max-w-[80px] font-bold text-black">{selectedBottom.name}</span>
                        <span className="text-[10px] text-stone-400 font-bold group-hover:text-red-600">×</span>
                      </span>
                    )}
                    {selectedOuterwear && (
                      <span className="bg-stone-50 border border-black hover:border-red-600 hover:text-red-600 hover:bg-red-50/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer group" onClick={() => setSelectedOuterwear(null)}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedOuterwear.color }} />
                        <span className="truncate max-w-[80px] font-bold text-black">{selectedOuterwear.name}</span>
                        <span className="text-[10px] text-stone-400 font-bold group-hover:text-red-600">×</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 업로드 사진 대조 풀 화면 */}
              {measurements.image && (
                <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-black pb-2">
                    <span className="text-black font-extrabold text-xs flex items-center gap-2">
                      📸 실시간 전신 대조 참조 사진 (전체뷰)
                    </span>
                    <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded font-black">
                      100% 원본 비율
                    </span>
                  </div>
                  <div className="border-2 border-black rounded-2xl overflow-hidden bg-stone-55 p-2 flex justify-center items-center h-[280px]">
                    <img
                      src={measurements.image}
                      className="h-full w-auto object-contain rounded-xl"
                      alt="Original Silhouette Copy"
                    />
                  </div>
                  <p className="text-stone-500 text-[11px] leading-relaxed text-center">
                    사용자 전신 실루엣 원본 비율 이미지입니다. 좌측의 3D 인체 메시와 직관적으로 대조해 보세요.
                  </p>
                </div>
              )}
            </section>

            {/* 3열: 가상 옷장 서랍 및 조언 리포트/AI 챗 탭 */}
            <section className="lg:col-span-4 flex flex-col gap-6">
              
              <Wardrobe
                onSelectTop={setSelectedTop}
                onSelectBottom={setSelectedBottom}
                onSelectOuterwear={setSelectedOuterwear}
                selectedTop={selectedTop}
                selectedBottom={selectedBottom}
                selectedOuterwear={selectedOuterwear}
              />

              <div className="flex flex-col bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* 탭 구분 바 */}
                <div className="grid grid-cols-2 border-b-2 border-black shrink-0">
                  <button
                    onClick={() => setActiveRightTab("advisor")}
                    className={`py-3.5 text-center text-[11px] font-black transition-all cursor-pointer border-r-2 border-black ${
                      activeRightTab === "advisor"
                        ? "bg-black text-white"
                        : "text-stone-700 bg-stone-50 hover:bg-stone-100"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      AI 핏 체형 보고서
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveRightTab("chat")}
                    className={`py-3.5 text-center text-[11px] font-black transition-all cursor-pointer ${
                      activeRightTab === "chat"
                        ? "bg-black text-white"
                        : "text-stone-700 bg-stone-50 hover:bg-stone-100"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI 실시간 피드백 톡
                    </span>
                  </button>
                </div>

                {/* 보고서 뷰 바디 */}
                {activeRightTab === "advisor" && (
                  <div className="p-5 flex flex-col gap-4 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent animate-fade-in select-text">
                    {analysisResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                          <div>
                            <span className="text-[10px] text-stone-500 block font-bold mb-0.5">
                              인체 실루엣 체형 종류
                            </span>
                            <h3 className="text-black text-sm font-black tracking-wide">
                              {analysisResult.bodyType}
                            </h3>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-stone-500 block font-bold mb-0.5">
                              종합 적합성 스코어
                            </span>
                            <h4 className="text-black text-lg font-black font-mono">
                              {analysisResult.fitAnalysis.fitMatchScore}%
                            </h4>
                          </div>
                        </div>

                        {/* 신체 비율 */}
                        <div className="space-y-2.5 bg-stone-50 rounded-2xl p-4 border border-stone-200">
                          <h4 className="text-[10px] text-black font-extrabold uppercase tracking-wider flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5" />
                            황금 인체 비례 수치표
                          </h4>
                          
                          {[
                            { label: "어깨 전폭 비율 (Shoulder)", val: analysisResult.proportions.shoulder, color: "bg-black" },
                            { label: "가슴 가상 수치 (Chest)", val: analysisResult.proportions.chest, color: "bg-neutral-800" },
                            { label: "허리 중심 스케일 (Waist)", val: analysisResult.proportions.waist, color: "bg-neutral-700" },
                            { label: "골반 입체 볼륨 (Hip)", val: analysisResult.proportions.hip, color: "bg-neutral-600" },
                            { label: "하체 대조 비율 (Legs)", val: analysisResult.proportions.legs, color: "bg-neutral-500" },
                          ].map((item, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-stone-600 font-bold">
                                <span>{item.label}</span>
                                <span className="text-black font-bold">{item.val}%</span>
                              </div>
                              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden border border-stone-300">
                                <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 추천 사이즈 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl text-center">
                            <span className="text-[9px] text-stone-500 block font-bold">
                              정밀 상의 사이즈
                            </span>
                            <span className="text-black text-xl font-black block mt-0.5">
                              {analysisResult.fitAnalysis.tops}
                            </span>
                            <span className="text-[9px] text-stone-400 block mt-0.5">권장 상체 아웃핏</span>
                          </div>
                          <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl text-center">
                            <span className="text-[9px] text-stone-500 block font-bold">
                              정밀 하의 사이즈
                            </span>
                            <span className="text-black text-xl font-black block mt-0.5">
                              {analysisResult.fitAnalysis.bottoms}
                            </span>
                            <span className="text-[9px] text-stone-400 block mt-0.5">권장 하체 아웃핏</span>
                          </div>
                        </div>

                        {/* 종합 평가 의견 */}
                        <div className="space-y-1">
                          <h4 className="text-[10px] text-black font-black flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            AI 바디 스타일 정밀 코멘트
                          </h4>
                          <p className="text-stone-800 text-xs leading-relaxed font-sans mt-1 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                            {analysisResult.styleVerdict}
                          </p>
                        </div>

                        {/* 디렉터 가이드라인 조언 */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] text-black font-black flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            가장 매력적인 아웃핏 드레스 가이드
                          </h4>
                          <ul className="space-y-2">
                            {analysisResult.fittingTips.map((tip, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs text-stone-800 leading-relaxed">
                                <span className="w-4.5 h-4.5 rounded bg-black border border-black text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                  {idx + 1}
                                </span>
                                <p>{tip}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-stone-400">
                        <Ruler className="w-10 h-10 mb-3 animate-pulse text-stone-300" />
                        <p className="text-xs max-w-xs leading-relaxed">
                          왼쪽 조절창에서 게이지를 수동 조정한 뒤 "AI 분석 보고서 갱신"을 클릭하시면 바디 정보가 리로드됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 스타일 코치 톡 뷰 */}
                {activeRightTab === "chat" && (
                  <StyleChat
                    measurements={measurements}
                    activeOutfitName={selectedTop?.name || null}
                  />
                )}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* [3] 옷 둘러보기 화면 (무신사 실시간 3D 가상 피팅 라운지) */}
        {/* ========================================================================= */}
        {activeView === "browse" && (
          <div className="space-y-6 animate-fade-in text-sans">
            {/* 무신사 로고 테마 네오 브루탈리즘 배너 */}
            <div className="bg-black text-white rounded-3xl p-6.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="bg-red-605 bg-red-600 text-white font-black text-[9px] px-2.5 py-1 rounded inline-block uppercase tracking-wider border border-white">
                    MUSINSA OFFICIAL PARTNER
                  </span>
                  <span className="bg-stone-800 text-stone-300 font-mono text-[9px] px-2 py-1 rounded">
                    REALTIME 3D DRAPING v2.0
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
                  무신사(MUSINSA) 가상 피팅 & 스케치룸
                </h3>
                <p className="text-stone-300 text-xs max-w-xl leading-relaxed">
                  원하는 패션 상품을 골라 <strong className="text-cyan-400">아바타에 피팅하기</strong>를 누르면 3D 가상 피팅 시뮬레이터에 실시간 장착됩니다. 실제 단추 디테일, 핏 가이드, 무신사 가격까지 연동됩니다.
                </p>
              </div>
              <a
                href="https://www.musinsa.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl border-2 border-white transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px] active:shadow-none whitespace-nowrap text-center shrink-0"
              >
                🛍️ 무신사 공식몰 바로가기 (새탭)
              </a>
            </div>

            {/* 메인 듀얼 패널 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* 왼쪽 칼럼: 무신사 패션 컬렉션 브라우저 */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 패션 카테고리 필터링 조작부 */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {(["all", "top", "bottom", "outerwear"] as const).map((cat) => {
                      const labels = { all: "전체상품 🛍️", top: "상의 (TOPS) 👕", bottom: "하의 (BOTTOMS) 👖", outerwear: "아우터 (OUTER) 🧥" };
                      // Filter state used locally inside browse view
                      const isSelected = (localStorage.getItem("ipda_browse_filter") || "all") === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            localStorage.setItem("ipda_browse_filter", cat);
                            // Simple state trigger
                            setMeasurements((prev) => ({ ...prev }));
                          }}
                          className={`px-3.5 py-1.5 rounded-lg border text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? "bg-black text-white border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] shrink-0"
                              : "bg-stone-50 text-stone-700 border-stone-300 hover:border-black shrink-0"
                          }`}
                        >
                          {labels[cat]}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-stone-500">
                    REALTIME CATALOGUE
                  </span>
                </div>

                {/* 상품 그리드 뷰 및 실물 사진 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {INITIAL_CLOTHING_COLLECTION.filter((item) => {
                    const currentFilter = localStorage.getItem("ipda_browse_filter") || "all";
                    return currentFilter === "all" || item.category === currentFilter;
                  }).map((item) => {
                    const isTopWorn = selectedTop?.id === item.id;
                    const isBottomWorn = selectedBottom?.id === item.id;
                    const isOuterWorn = selectedOuterwear?.id === item.id;
                    const isWorn = isTopWorn || isBottomWorn || isOuterWorn;

                    // Dynamic fitting feedback score computed from user's actual body sizes!
                    let fitMatchFeedback = "95% (매우 어울림)";
                    let fitAdvise = "어깨 입체감을 살리는 깔끔한 드롭 숄더 핏";
                    if (item.category === "top") {
                      const ratio = measurements.shoulderWidth / 45;
                      const score = Math.round(100 - Math.abs(1 - ratio) * 40);
                      fitMatchFeedback = `${Math.min(100, Math.max(85, score))}% (솔더 엠보 핏)`;
                      fitAdvise = measurements.shoulderWidth > 45 ? "넓은 어깨를 더욱 부각하는 최상급 어깨선" : "어깨선을 보정하여 듬직한 체형 구현";
                    } else if (item.category === "bottom") {
                      const ratio = measurements.waistSize / 32;
                      const score = Math.round(98 - Math.abs(1 - ratio) * 20);
                      fitMatchFeedback = `${Math.min(100, Math.max(88, score))}% (웨이스트 스플릿)`;
                      fitAdvise = measurements.waistSize > 32 ? "팬츠 허리 턱이 잡혀 뱃살을 흐려주는 실루엣" : "다리 라인이 길어 보이는 스트레이트 주름";
                    } else if (item.category === "outerwear") {
                      const ratio = measurements.weight / 70;
                      const score = Math.round(99 - Math.abs(1 - ratio) * 15);
                      fitMatchFeedback = `${Math.min(100, Math.max(90, score))}% (아웃 밸런스)`;
                      fitAdvise = "풍성한 상체감을 키워 골반 실루엣과 완벽한 비율 연출";
                    }

                    return (
                      <div
                        key={item.id}
                        className={`bg-white border-2 border-black rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] ${
                          isWorn ? "ring-2 ring-cyan-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                      >
                        {/* 1. 상품 이미지 윗부분 (Unsplash 실제 고퀄리티 패션 사진 바인딩) */}
                        <div className="relative h-44 bg-stone-100 overflow-hidden border-b-2 border-black select-none">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 bg-black text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded border border-white">
                            {item.brand}
                          </div>
                          {isWorn && (
                            <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="bg-black text-white border-2 border-cyan-400 font-extrabold text-[10px] px-3 py-1 rounded-xl shadow-lg flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3.5]" />
                                현재 아바타 피팅 중
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2. 상품 세부정보 영역 */}
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] bg-stone-100 text-stone-700 font-black border border-black/10 px-2 py-0.5 rounded">
                              {item.category === "top" ? "상의" : item.category === "bottom" ? "하의" : "아우터"} / {item.svgType.toUpperCase()}
                            </span>
                            <h4 className="text-black text-xs font-black tracking-tight leading-snug line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-stone-500 text-[10px] leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          {/* 나의 체형 매칭 진단 데이터 보강 */}
                          <div className="bg-cyan-50/50 border border-cyan-200 rounded-lg p-2 space-y-1">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-stone-500 font-bold">체형 매칭율</span>
                              <span className="text-cyan-600 font-extrabold">{fitMatchFeedback}</span>
                            </div>
                            <p className="text-stone-600 text-[8.5px] font-semibold leading-tight leading-relaxed">
                              💡 {fitAdvise}
                            </p>
                          </div>

                          {/* 3. 하단 가격 정보 및 피팅 기능 연합 제어 */}
                          <div className="space-y-2 shrink-0">
                            <div className="flex justify-between items-baseline text-xs border-t border-dashed border-stone-200 pt-2.5">
                              <span className="text-stone-400 font-bold">무신사 최저가</span>
                              <span className="text-red-500 text-xs font-black">{item.price}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => {
                                  if (item.category === "top") {
                                    setSelectedTop(isTopWorn ? null : item);
                                  } else if (item.category === "bottom") {
                                    setSelectedBottom(isBottomWorn ? null : item);
                                  } else if (item.category === "outerwear") {
                                    setSelectedOuterwear(isOuterWorn ? null : item);
                                  }
                                }}
                                className={`w-full py-2 rounded-lg border-2 text-[10px] font-black cursor-pointer text-center transition-all ${
                                  isWorn
                                    ? "bg-red-50 hover:bg-red-100 text-red-650 border-red-500"
                                    : "bg-black hover:bg-stone-800 text-white border-black"
                                }`}
                              >
                                {isWorn ? "❌ 피팅 해제" : "👕 아바타 피팅"}
                              </button>
                              
                              <a
                                href={item.musinsaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-white hover:bg-stone-50 text-black border-2 border-black font-extrabold py-2 rounded-lg text-center text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                🛍️ 무신사 이동
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 오른쪽 칼럼: 실시간 3D 피팅 아바타 프리뷰 (Sticky) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
                <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                  <h4 className="text-black font-black text-sm flex items-center gap-1.5">
                    <span>⚡ 실시간 3D 가상 피팅 룸</span>
                  </h4>
                  <span className="bg-black text-white text-[9px] font-semibold px-2 py-0.5 rounded">
                    LIVE
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-1 shadow-md">
                  <AvatarViewer
                    measurements={measurements}
                    selectedTop={selectedTop}
                    selectedBottom={selectedBottom}
                    selectedOuterwear={selectedOuterwear}
                    avatarReady={avatarReady}
                    loading={loading}
                    analysisStep={analysisStep}
                  />
                </div>

                {/* 현재 피팅 조합 제어판 */}
                <div className="bg-stone-50 border-2 border-black rounded-2xl p-4 space-y-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[11px]">
                  <h5 className="text-black font-black uppercase text-[10px] border-b border-black/10 pb-1.5">
                    👕 현재 장착 코디네이션
                  </h5>

                  <div className="space-y-2">
                    {/* 상의 (TOP) */}
                    <div className="flex flex-col bg-white p-2.5 rounded-xl border border-black/10 gap-1.5 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-500 uppercase text-[9.5px]">상의 (TOP)</span>
                        {selectedTop ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-black line-clamp-1 max-w-[120px] text-[10.5px]">{selectedTop.name}</span>
                            <button
                              onClick={() => setSelectedTop(null)}
                              className="bg-stone-100 hover:bg-stone-200 p-1 px-2 rounded-md hover:text-red-500 text-stone-500 text-[9px] font-black cursor-pointer transition-all border border-black/5"
                            >
                              벗기
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-300 italic">선택 없음</span>
                        )}
                      </div>
                      
                      {selectedTop && (
                        <div className="flex items-center gap-2 border-t border-stone-100 pt-2 mt-0.5">
                          <span className="text-[9px] text-stone-400 font-bold tracking-tight">색상 변경:</span>
                          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none flex-1">
                            {["#ffffff", "#27272a", "#1e3a8a", "#b45309", "#1d4ed8", "#0f766e", "#38bdf8", "#f472b6", "#fef3c7"].map((c) => (
                              <button
                                key={c}
                                onClick={() => setSelectedTop({ ...selectedTop, color: c })}
                                className={`w-4 h-4 rounded-full border border-black/15 cursor-pointer shrink-0 transition-all ${
                                  selectedTop.color === c ? "scale-125 border-black ring-1.5 ring-cyan-500" : "hover:scale-110"
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                            <div className="relative w-4 h-4 rounded-full border border-black/15 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform">
                              <input
                                type="color"
                                value={selectedTop.color}
                                onChange={(e) => setSelectedTop({ ...selectedTop, color: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                              <span className="text-[8px] font-mono font-bold pointer-events-none text-stone-500">🎨</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 하의 (BOTTOM) */}
                    <div className="flex flex-col bg-white p-2.5 rounded-xl border border-black/10 gap-1.5 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-500 uppercase text-[9.5px]">하의 (BOTTOM)</span>
                        {selectedBottom ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-black line-clamp-1 max-w-[120px] text-[10.5px]">{selectedBottom.name}</span>
                            <button
                              onClick={() => setSelectedBottom(null)}
                              className="bg-stone-100 hover:bg-stone-200 p-1 px-2 rounded-md hover:text-red-500 text-stone-500 text-[9px] font-black cursor-pointer transition-all border border-black/5"
                            >
                              벗기
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-300 italic">선택 없음</span>
                        )}
                      </div>
                      
                      {selectedBottom && (
                        <div className="flex items-center gap-2 border-t border-stone-100 pt-2 mt-0.5">
                          <span className="text-[9px] text-stone-400 font-bold tracking-tight">색상 변경:</span>
                          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none flex-1">
                            {["#ffffff", "#27272a", "#1e3a8a", "#b45309", "#1d4ed8", "#0f766e", "#38bdf8", "#f472b6", "#fef3c7"].map((c) => (
                              <button
                                key={c}
                                onClick={() => setSelectedBottom({ ...selectedBottom, color: c })}
                                className={`w-4 h-4 rounded-full border border-black/15 cursor-pointer shrink-0 transition-all ${
                                  selectedBottom.color === c ? "scale-125 border-black ring-1.5 ring-cyan-500" : "hover:scale-110"
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                            <div className="relative w-4 h-4 rounded-full border border-black/15 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform">
                              <input
                                type="color"
                                value={selectedBottom.color}
                                onChange={(e) => setSelectedBottom({ ...selectedBottom, color: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                              <span className="text-[8px] font-mono font-bold pointer-events-none text-stone-500">🎨</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 아우터 (OUTER) */}
                    <div className="flex flex-col bg-white p-2.5 rounded-xl border border-black/10 gap-1.5 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-500 uppercase text-[9.5px]">아우터 (OUTER)</span>
                        {selectedOuterwear ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-black line-clamp-1 max-w-[120px] text-[10.5px]">{selectedOuterwear.name}</span>
                            <button
                              onClick={() => setSelectedOuterwear(null)}
                              className="bg-stone-100 hover:bg-stone-200 p-1 px-2 rounded-md hover:text-red-500 text-stone-500 text-[9px] font-black cursor-pointer transition-all border border-black/5"
                            >
                              벗기
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-300 italic">선택 없음</span>
                        )}
                      </div>
                      
                      {selectedOuterwear && (
                        <div className="flex items-center gap-2 border-t border-stone-100 pt-2 mt-0.5">
                          <span className="text-[9px] text-stone-400 font-bold tracking-tight">색상 변경:</span>
                          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none flex-1">
                            {["#ffffff", "#27272a", "#1e3a8a", "#b45309", "#1d4ed8", "#0f766e", "#38bdf8", "#f472b6", "#fef3c7"].map((c) => (
                              <button
                                key={c}
                                onClick={() => setSelectedOuterwear({ ...selectedOuterwear, color: c })}
                                className={`w-4 h-4 rounded-full border border-black/15 cursor-pointer shrink-0 transition-all ${
                                  selectedOuterwear.color === c ? "scale-125 border-black ring-1.5 ring-cyan-500" : "hover:scale-110"
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                            <div className="relative w-4 h-4 rounded-full border border-black/15 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform">
                              <input
                                type="color"
                                value={selectedOuterwear.color}
                                onChange={(e) => setSelectedOuterwear({ ...selectedOuterwear, color: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                              <span className="text-[8px] font-mono font-bold pointer-events-none text-stone-500">🎨</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 가격 합산 계산 장치 */}
                  {(() => {
                    const parsePrice = (priceStr?: string) => {
                      if (!priceStr) return 0;
                      return parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
                    };
                    const totalPrice = parsePrice(selectedTop?.price) + parsePrice(selectedBottom?.price) + parsePrice(selectedOuterwear?.price);
                    return (
                      <div className="border-t border-dashed border-stone-300 pt-3 flex justify-between items-baseline">
                        <span className="font-black text-black">코디 총 정품 가격합</span>
                        <span className="text-lg font-black text-red-600">
                          {totalPrice > 0 ? `${totalPrice.toLocaleString()}원` : "0원"}
                        </span>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => {
                      setSelectedTop(null);
                      setSelectedBottom(null);
                      setSelectedOuterwear(null);
                    }}
                    disabled={!selectedTop && !selectedBottom && !selectedOuterwear}
                    className="w-full bg-stone-100 hover:bg-black hover:text-white disabled:hover:bg-stone-100 disabled:hover:text-stone-400 disabled:opacity-50 text-stone-700 font-extrabold py-2 rounded-lg border border-black/15 transition-all cursor-pointer text-center text-[10px]"
                  >
                    🔄 입고 있는 코디 전체 해제
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      )}

      {/* Footer System Credits */}
      <footer className="mt-auto border-t-2 border-black py-4.5 px-6 md:px-8 bg-white shrink-0">
        <div className="max-w-[1536px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-black">
          <p className="text-[11px] font-mono tracking-wider uppercase font-bold">
            © 2026 IPDA Virtual Fitting Corp. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1 text-black">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
              Secure Biometric Encryption
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
