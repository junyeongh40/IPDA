import React, { useState, useEffect } from "react";
import { Garment, GarmentCategory } from "../types";
import { Shirt, Footprints, Layers, Check, Plus, ShoppingBag, Palette, HelpCircle } from "lucide-react";

interface WardrobeProps {
  onSelectTop: (garment: Garment | null) => void;
  onSelectBottom: (garment: Garment | null) => void;
  onSelectOuterwear: (garment: Garment | null) => void;
  selectedTop: Garment | null;
  selectedBottom: Garment | null;
  selectedOuterwear: Garment | null;
}

// Preloaded real popular items from Musinsa
export const INITIAL_CLOTHING_COLLECTION: Garment[] = [
  // TOPS
  {
    id: "musinsa-01",
    name: "쿨 텐션 반소매 크루넥",
    brand: "무신사 스탠다드",
    category: "top",
    color: "#ffffff",
    description: "무신사 1위 기능성 반팔 티셔츠. 탄탄하고 비침 없는 실루엣.",
    svgType: "tshirt",
    fitMultiplier: 1.0,
    price: "19,900원",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/1149328",
  },
  {
    id: "musinsa-02",
    name: "오버사이즈 헤비웨이트 후디",
    brand: "무신사 스탠다드",
    category: "top",
    color: "#27272a",
    description: "탄탄한 중량감의 프렌치 테리 헤비 코튼 후드티셔츠.",
    svgType: "hoodie",
    fitMultiplier: 1.25,
    price: "39,900원",
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/1848523",
  },
  {
    id: "musinsa-03",
    name: "워블 보스턴 니트",
    brand: "예일 (YALE)",
    category: "top",
    color: "#1e3a8a",
    description: "아이비리그 무드의 편안한 세미오버핏 프렙 니트.",
    svgType: "sweater",
    fitMultiplier: 1.15,
    price: "49,000원",
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/2034177",
  },
  {
    id: "musinsa-04",
    name: "옥스포드 스트라이프 셔츠",
    brand: "노맨틀 (NOMANTLE)",
    category: "top",
    color: "#0284c7",
    description: "정교하고 실용적인 주름 방지 클래식 블루 버티컬 스트라이프 셔츠.",
    svgType: "shirt",
    fitMultiplier: 0.95,
    price: "34,000원",
    imageUrl: "https://images.unsplash.com/photo-1620012253295-c05518e99309?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/3412581",
  },

  // BOTTOMS
  {
    id: "musinsa-05",
    name: "와이드 세비지 데님 팬츠 인디고",
    brand: "토피 (TOFFEE)",
    category: "bottom",
    color: "#1d4ed8",
    description: "풍성하고 볼륨 있는 사계절 전천후 데님 청바지.",
    svgType: "jeans",
    fitMultiplier: 1.15,
    price: "48,000원",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/1551829",
  },
  {
    id: "musinsa-06",
    name: "버뮤다 치노 하프 팬츠",
    brand: "무신사 스탠다드",
    category: "bottom",
    color: "#78350f",
    description: "트렌디한 무릎 기장감의 도톰한 하프 팬츠 치노 바지.",
    svgType: "shorts",
    fitMultiplier: 0.98,
    price: "25,900원",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/2458129",
  },
  {
    id: "musinsa-07",
    name: "아코디언 벨티드 플리츠 스커트",
    brand: "그로브 (GROVE)",
    category: "bottom",
    color: "#0f766e",
    description: "A라인 플리츠 디테일로 페미닌하고 단정한 주름치마.",
    svgType: "skirt",
    fitMultiplier: 1.1,
    price: "79,000원",
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb314a275152?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/3419512",
  },

  // OUTERWEAR
  {
    id: "musinsa-08",
    name: "MTR 미니멀 오버 코트 캐멀",
    brand: "쿠어 (COOR)",
    category: "outerwear",
    color: "#b45309",
    description: "최상급 MTR 울 원단으로 미니멀함을 살린 프리미엄 캐멀 롱코트.",
    svgType: "coat",
    fitMultiplier: 1.3,
    price: "248,000원",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/1623912",
  },
  {
    id: "musinsa-09",
    name: "레더 봄버 자켓 챠콜",
    brand: "라퍼지스토어",
    category: "outerwear",
    color: "#1f2937",
    description: "은은한 세미 광택감의 이탈리안 빈티지 레더 항공점퍼.",
    svgType: "jacket",
    fitMultiplier: 1.2,
    price: "89,000원",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=550&q=80&auto=format&fit=crop",
    musinsaUrl: "https://www.musinsa.com/app/goods/1922384",
  },
];

// Aesthetic Custom Preset Colors mimicking famous Musinsa brands colors
const COLOR_PRESETS = [
  { value: "#ffffff", label: "화이트" },
  { value: "#27272a", label: "제트블랙" },
  { value: "#1e3a8a", label: "인디네이비" },
  { value: "#b45309", label: "멜란지브라운" },
  { value: "#1d4ed8", label: "셀비지데님" },
  { value: "#0f766e", label: "딥그린" },
  { value: "#ef4444", label: "스트릿레드" },
  { value: "#eab308", label: "스포티옐로우" },
  { value: "#a855f7", label: "네온퍼플" },
  { value: "#10b981", label: "트렌디그린" },
];

export default function Wardrobe({
  onSelectTop,
  onSelectBottom,
  onSelectOuterwear,
  selectedTop,
  selectedBottom,
  selectedOuterwear,
}: WardrobeProps) {
  const [activeTab, setActiveTab] = useState<GarmentCategory>("top");
  const [garments, setGarments] = useState<Garment[]>(() => {
    // Load from localStorage or defaults
    const saved = localStorage.getItem("ipda_custom_garments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return [...INITIAL_CLOTHING_COLLECTION, ...parsed];
      } catch (e) {
        console.error("Error loading custom garments", e);
      }
    }
    return INITIAL_CLOTHING_COLLECTION;
  });

  // Custom Item Form states
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<GarmentCategory>("top");
  const [customColor, setCustomColor] = useState("#27272a");
  const [customFit, setCustomFit] = useState<"tight" | "regular" | "loose">("regular");
  const [customUrl, setCustomUrl] = useState("");
  const [customModelType, setCustomModelType] = useState<Garment["svgType"]>("tshirt");

  // Synchronize model types when category changes
  useEffect(() => {
    if (customCategory === "top") {
      setCustomModelType("tshirt");
    } else if (customCategory === "bottom") {
      setCustomModelType("jeans");
    } else if (customCategory === "outerwear") {
      setCustomModelType("jacket");
    }
  }, [customCategory]);

  const handleCreateCustomGarment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      alert("의류의 이름을 등록해 주세요!");
      return;
    }

    // Set fitting multipliers based on chosen fit tightness
    const fitMultiplier = customFit === "tight" ? 0.92 : customFit === "loose" ? 1.24 : 1.05;

    const newGarment: Garment = {
      id: "custom-" + Date.now(),
      name: customName.trim(),
      category: customCategory,
      color: customColor,
      description: `[무신사 가상 피팅] 실존 쇼핑몰 등록 상품. 배율: ${customFit === "tight" ? "타이트" : customFit === "loose" ? "오버핏" : "레귤러"}`,
      svgType: customModelType,
      fitMultiplier,
    };

    // Save custom list only to localStorage
    const storedStr = localStorage.getItem("ipda_custom_garments") || "[]";
    const storedList = JSON.parse(storedStr);
    storedList.push(newGarment);
    localStorage.setItem("ipda_custom_garments", JSON.stringify(storedList));

    // Update state
    setGarments((prev) => [...prev, newGarment]);

    // Automatically wear the new custom item immediately onto the avatar!
    if (customCategory === "top") onSelectTop(newGarment);
    else if (customCategory === "bottom") onSelectBottom(newGarment);
    else if (customCategory === "outerwear") onSelectOuterwear(newGarment);

    // Reset Form
    setCustomName("");
    setCustomUrl("");
    setShowCustomForm(false);
  };

  const handleResetGarments = () => {
    if (confirm("새로 등록한 커스텀 의류들을 모두 초기화하시겠습니까?")) {
      localStorage.removeItem("ipda_custom_garments");
      setGarments(INITIAL_CLOTHING_COLLECTION);
      onSelectTop(null);
      onSelectBottom(null);
      onSelectOuterwear(null);
    }
  };

  const filteredCollection = garments.filter((item) => item.category === activeTab);

  const handleItemClick = (item: Garment) => {
    if (item.category === "top") {
      if (selectedTop?.id === item.id) {
        onSelectTop(null);
      } else {
        onSelectTop(item);
      }
    } else if (item.category === "bottom") {
      if (selectedBottom?.id === item.id) {
        onSelectBottom(null);
      } else {
        onSelectBottom(item);
      }
    } else if (item.category === "outerwear") {
      if (selectedOuterwear?.id === item.id) {
        onSelectOuterwear(null);
      } else {
        onSelectOuterwear(item);
      }
    }
  };

  const isDraped = (item: Garment): boolean => {
    if (item.category === "top") return selectedTop?.id === item.id;
    if (item.category === "bottom") return selectedBottom?.id === item.id;
    if (item.category === "outerwear") return selectedOuterwear?.id === item.id;
    return false;
  };

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-black">
        <h4 className="text-black text-xs font-black tracking-wider uppercase flex items-center gap-1.5" id="wardrobe-header">
          <Layers className="w-4 h-4 text-black" />
          옷 입혀보기
        </h4>
        <span className="text-[10px] bg-black text-white px-2.5 py-0.5 rounded border border-black uppercase font-bold">
          총 {garments.length}개 의상 지원
        </span>
      </div>

      {/* Button tools: Custom add & Reset */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border-2 text-[11px] font-black transition-all cursor-pointer ${
            showCustomForm
              ? "bg-stone-100 text-black border-black"
              : "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
          }`}
        >
          <Plus className="w-4 h-4" />
          {showCustomForm ? "등록 접기" : "실제 무신사 의류 등록하기"}
        </button>
        {garments.length > INITIAL_CLOTHING_COLLECTION.length && (
          <button
            onClick={handleResetGarments}
            className="px-3 py-2 bg-stone-55 hover:bg-red-50 hover:text-red-650 hover:border-red-600 rounded-xl border border-stone-200 text-[10px] font-bold text-stone-600 transition-colors cursor-pointer"
          >
            기본 의상 리셋
          </button>
        )}
      </div>

      {/* Interactive Custom Clothes Register Form */}
      {showCustomForm && (
        <form
          onSubmit={handleCreateCustomGarment}
          className="bg-stone-50 border-2 border-black rounded-2xl p-4.5 space-y-3.5 animate-fade-in text-[11px] text-stone-700"
        >
          <div className="flex items-center gap-1.5 font-black border-b border-dashed border-stone-200 pb-2">
            <ShoppingBag className="w-4 h-4 text-black" />
            <span className="text-black text-xs">무신사/기타 상점 실물 옷 피팅 연동</span>
          </div>

          {/* Category SELECT */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-extrabold uppercase">1. 의류의 카테고리</label>
            <div className="grid grid-cols-3 gap-2">
              {(["top", "bottom", "outerwear"] as GarmentCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCustomCategory(cat)}
                  className={`py-1.5 text-[10px] font-black rounded-lg border-2 transition-all cursor-pointer ${
                    customCategory === cat
                      ? "bg-black text-white border-black"
                      : "bg-white text-stone-650 border-stone-200"
                  }`}
                >
                  {cat === "top" ? "상의" : cat === "bottom" ? "하의" : "아우터"}
                </button>
              ))}
            </div>
          </div>

          {/* Model Fit Template Selection */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-extrabold uppercase">2. 3D 드레이프 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {customCategory === "top" && (
                <>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("tshirt")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "tshirt" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    티셔츠 / 반소매
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("hoodie")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "hoodie" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    후드티 / 오버웨어
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("sweater")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "sweater" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    니트 / 스웨터
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("shirt")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "shirt" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    포멀 드레스 셔츠
                  </button>
                </>
              )}
              {customCategory === "bottom" && (
                <>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("jeans")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "jeans" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    자연스런 청바지/데님
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("shorts")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "shorts" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    반바지/쇼츠
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("skirt")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "skirt" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    주름스커트/치마
                  </button>
                </>
              )}
              {customCategory === "outerwear" && (
                <>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("jacket")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "jacket" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    봄버 / 레더 코치 자켓
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomModelType("coat")}
                    className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold ${
                      customModelType === "coat" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-600"
                    }`}
                  >
                    트렌치 오버 롱코트
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ITEM NAME */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-extrabold uppercase">3. 상품 이름 또는 브랜드명</label>
            <input
              type="text"
              placeholder="예: [토피] 에센셜 코튼 카디건 블랙"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-white text-black border-2 border-black rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-0"
            />
          </div>

          {/* PRESET COLORS */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-extrabold uppercase flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" />
              4. 대표 색상 피킹
            </label>
            <div className="flex flex-wrap gap-2.5 bg-white p-2 border-2 border-black rounded-xl justify-center">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = customColor === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setCustomColor(preset.value)}
                    className={`w-6.5 h-6.5 rounded-full border-2 transition-transform ${
                      isSelected ? "border-black scale-115 rotate-12" : "border-stone-300 hover:scale-110"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.label}
                  />
                );
              })}
              {/* Optional custom hex picker */}
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-6.5 h-6.5 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                title="직접 선택"
              />
            </div>
          </div>

          {/* FIT OPTION */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-extrabold uppercase">5. 실물 피팅감 수치 비율</label>
            <div className="grid grid-cols-3 gap-2">
              {(["tight", "regular", "loose"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCustomFit(f)}
                  className={`py-1.5 rounded-lg border transition-all cursor-pointer font-bold text-[10px] ${
                    customFit === f
                      ? "bg-black text-white border-black"
                      : "bg-white text-stone-600 border-stone-200"
                  }`}
                >
                  {f === "tight" ? "슬림핏 (92%)" : f === "regular" ? "정핏 (105%)" : "오버핏 (124%)"}
                </button>
              ))}
            </div>
          </div>

          {/* MUSINSA LINK */}
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-extrabold uppercase flex items-center gap-1">
              6. 무신사 상품 주소 연결 <span className="text-[8px] text-stone-400 font-normal">(선택사항)</span>
            </label>
            <input
              type="url"
              placeholder="https://www.musinsa.com/app/goods/..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full bg-white text-black border-2 border-black rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-0"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full bg-black hover:bg-stone-900 border-2 border-black text-white text-xs font-black py-3 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
          >
            입력한 무신사 의류 아바타에 실시간 입혀보기
          </button>
        </form>
      )}

      {/* Closet Categories Toggles */}
      <div className="grid grid-cols-3 gap-2">
        {(["top", "bottom", "outerwear"] as GarmentCategory[]).map((tab) => {
          const isActive = activeTab === tab;
          const tabLabel = tab === "top" ? "상의" : tab === "bottom" ? "하의" : "아우터";
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-3 rounded-xl border text-[11px] font-black tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px]"
                  : "bg-stone-50 text-stone-650 border-stone-200 hover:border-black hover:text-black"
              }`}
            >
              {tab === "top" && <Shirt className="w-3.5 h-3.5" />}
              {tab === "bottom" && <Footprints className="w-3.5 h-3.5" />}
              {tab === "outerwear" && <Layers className="w-3.5 h-3.5" />}
              {tabLabel}
            </button>
          );
        })}
      </div>

      {/* Outfits selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
        {filteredCollection.length === 0 ? (
          <div className="col-span-2 text-center py-6 text-stone-400 text-[11px]">
            등록된 옷이 없습니다. '실제 무신사 의류 등록하기'를 클릭해서 의상을 추가해 보세요!
          </div>
        ) : (
          filteredCollection.map((item) => {
            const active = isDraped(item);
            const typeLabel = item.category === "top" ? "상의" : item.category === "bottom" ? "하의" : "아우터";
            const isCustom = item.id.startsWith("custom-");

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{ contentVisibility: "auto" }}
                className={`relative p-3 bg-stone-50 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-3 group items-center overflow-hidden h-[74px] ${
                  active
                    ? "border-2 border-black bg-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "border-stone-200 hover:border-black hover:bg-stone-100"
                }`}
              >
                {/* Colored swatch preview icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-black/10 shrink-0 transition-transform duration-350 group-hover:scale-105 shadow-sm"
                  style={{ backgroundColor: item.color }}
                >
                  <Shirt
                    className={`w-5 h-5 ${
                      item.color === "#ffffff" || item.color === "#fafafa" || item.color === "#e2e8f0" || item.color === "#cbd5e1"
                        ? "text-stone-900"
                        : "text-white"
                    } drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.3)]`}
                  />
                </div>

                {/* Garment details text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-stone-500 font-black uppercase tracking-wider">
                      {typeLabel}
                    </span>
                    {isCustom && (
                      <span className="text-[7.5px] bg-red-650 text-white border border-black/10 px-1 rounded-sm uppercase tracking-wide font-black">
                        Custom
                      </span>
                    )}
                  </div>
                  <h5 className="text-black text-xs font-black tracking-wide truncate mt-0.5" title={item.name}>
                    {item.name}
                  </h5>
                  <p className="text-stone-500 text-[9.5px] truncate leading-normal" title={item.description}>
                    {item.description}
                  </p>
                </div>

                {/* Checkmark overlay active */}
                {active && (
                  <div className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-black text-white flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
