import React, { useState, useRef } from "react";
import { UserMeasurements, Garment } from "../types";
import { 
  RotateCw, Maximize2, Minimize2, ZoomIn, Eye, 
  Sparkles, ShieldCheck, Sun, Grid, Warehouse, Palette
} from "lucide-react";

interface AvatarViewerProps {
  measurements: UserMeasurements;
  selectedTop: Garment | null;
  selectedBottom: Garment | null;
  selectedOuterwear: Garment | null;
  avatarReady: boolean;
  loading: boolean;
  analysisStep: string;
}

// 4 Exquisite Skin Tone Presets matching physical human tones
const SKIN_TONES = [
  { id: "ivory", label: "아이보리 (Ivory)", base: "#FFE5D4", bright: "#FFF6EE", shadow: "#F3C7B3", lip: "#FF8E8E" },
  { id: "beige", label: "베이지 (Classic)", base: "#F5C3A5", bright: "#FFF0E5", shadow: "#D99E7F", lip: "#E06B6B" },
  { id: "tan", label: "샌드 탠 (Tan)", base: "#CE8E64", bright: "#E5AF8D", shadow: "#AD6E46", lip: "#AF4B4B" },
  { id: "bronze", label: "브론즈 (Bronze)", base: "#8E5535", bright: "#A46D4B", shadow: "#643318", lip: "#823131" }
];

// Stylized Hair Preset Options
const HAIR_PRESETS = [
  { id: "braid", label: "센터 파트 댕기머리" },
  { id: "waves", label: "포멀 웨이브 헤어" },
  { id: "updo", label: "미니멀 번 스타일" }
];

// Face Expressions
const EXPRESSIONS = [
  { id: "chic", label: "도도함 (Chic)" },
  { id: "smile", label: "미소 (Serene)" },
  { id: "proud", label: "당당함 (Proud)" },
  { id: "natural", label: "내추럴 (Soft)" }
];

// High-Fashion Backdrop Presets
const BACKDROPS = [
  { id: "studio", label: "미니멀 스튜디오 (Studio Grid)", bg: "bg-stone-50", line: "rgba(0,0,0,0.035)", glow: "from-blue-50/20 to-stone-100" },
  { id: "runway", label: "파리 런웨이 (Paris Runway)", bg: "bg-neutral-950", line: "rgba(255,255,255,0.02)", glow: "from-amber-500/10 to-transparent" },
  { id: "showroom", label: "크림 쇼룸 (Muted Luxury)", bg: "bg-amber-50/20", line: "rgba(0,0,0,0.025)", glow: "from-orange-100/10 to-stone-50/30" }
];

export default function AvatarViewer({
  measurements,
  selectedTop,
  selectedBottom,
  selectedOuterwear,
  avatarReady,
  loading,
  analysisStep,
}: AvatarViewerProps) {
  const { gender, height, weight, shoulderWidth, waistSize, hipSize, preferredFit } = measurements;

  // Interactivity States
  const [yaw, setYaw] = useState<number>(15); // Slight angle default for 3D depth
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const startYawRef = useRef<number>(0);

  // Aesthetic Customizer States
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [skinTone, setSkinTone] = useState<string>("beige");
  const [hairPreset, setHairPreset] = useState<string>("braid");
  const [expression, setExpression] = useState<string>("chic");
  const [backdrop, setBackdrop] = useState<string>("studio");
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panY, setPanY] = useState<number>(0);
  const [showMetrics, setShowMetrics] = useState<boolean>(true);
  const [showGlasses, setShowGlasses] = useState<boolean>(true);

  // Mouse Drag to Rotate
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
    startYawRef.current = yaw;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    setYaw(startYawRef.current + deltaX * 0.6);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      startXRef.current = e.touches[0].clientX;
      startYawRef.current = yaw;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    setYaw(startYawRef.current + deltaX * 0.6);
  };

  const handleMouseUpOrLeave = () => setIsDragging(false);

  // Math Setup for Realistic Elliptical 3D Projection
  const rad = (yaw * Math.PI) / 180;
  const cosYaw = Math.cos(rad);
  const sinYaw = Math.sin(rad);

  const centerX = 120;
  const heightRatio = height / 175;
  const bottomFootY = 350;
  const headTopY = 48 + (175 - height) * 0.35;
  const bulkFactor = Math.sqrt(weight / 70);

  // Horizontal Semi-Axes parameters (Width bounds at Front)
  const sHalf = (shoulderWidth * 0.88) * (gender === "male" ? 1.05 : 0.94) * bulkFactor;
  const wHalf = (waistSize * 1.05) * bulkFactor;
  const hHalf = (hipSize * 0.36) * (gender === "female" ? 1.13 : 1.01) * bulkFactor;

  // Joint vertical levels
  const neckY = headTopY + 28;
  const shoulderY = neckY + 11;
  const chestY = shoulderY + 34;
  const waistY = chestY + 58;
  const hipY = waistY + 44;
  const kneeY = hipY + 62 * heightRatio;
  const ankleY = bottomFootY - 15;

  // Mathematical 3D Ellipsoid Contour width projection
  // Projected width W(theta) = sqrt( Width^2 * cos^2(theta) + Depth^2 * sin^2(theta) )
  const getEllipsoidProfile = (width: number, depthRatio: number) => {
    const depth = width * depthRatio;
    return Math.sqrt(width * width * cosYaw * cosYaw + depth * depth * sinYaw * sinYaw);
  };

  // Profile Radii
  const rNeck = getEllipsoidProfile(11, 0.82);
  const rSh = getEllipsoidProfile(sHalf, 0.58);
  const rCh = getEllipsoidProfile((sHalf + wHalf) * 0.52, 0.68);
  const rWaist = getEllipsoidProfile(wHalf, 0.70);
  const rHip = getEllipsoidProfile(hHalf * 2.3, 0.74);

  // Profile Bound coordinates
  const neckL = centerX - rNeck, neckR = centerX + rNeck;
  const shL = centerX - rSh, shR = centerX + rSh;
  const chL = centerX - rCh, chR = centerX + rCh;
  const wtL = centerX - rWaist, wtR = centerX + rWaist;
  const hipL = centerX - rHip, hipR = centerX + rHip;

  // Active Skin Colors
  const activeSkin = SKIN_TONES.find(t => t.id === skinTone) || SKIN_TONES[1];

  // Helper: Curved Human Muscular cylinder limbs (arms/legs)
  const drawOrganicLimb = (
    y1: number,
    y2: number,
    cx1: number,
    cx2: number,
    r1: number,
    r2: number,
    isLeft: boolean
  ) => {
    const depthFactor = 0.85;
    const rx1 = r1 * Math.sqrt(cosYaw * cosYaw + depthFactor * sinYaw * sinYaw);
    const rx2 = r2 * Math.sqrt(cosYaw * cosYaw + depthFactor * sinYaw * sinYaw);

    const x1L = cx1 - rx1;
    const x1R = cx1 + rx1;
    const x2L = cx2 - rx2;
    const x2R = cx2 + rx2;

    // Curved muscular bulging points (Bezier control offsets)
    const midY = (y1 + y2) * 0.5;
    const bulge = isLeft ? -1.8 : 1.8;
    const lMidX = (x1L + x2L) * 0.5 + bulge;
    const rMidX = (x1R + x2R) * 0.5 + bulge;

    return (
      <g>
        <path
          d={`
            M ${x1L},${y1}
            Q ${lMidX},${midY} ${x2L},${y2}
            L ${x2R},${y2}
            Q ${rMidX},${midY} ${x1R},${y1}
            Z
          `}
          fill="url(#bodyOrganicGrad)"
          stroke="#1c1917"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Soft contour shading */}
        <path
          d={`
            M ${isLeft ? x1L : x1L + rx1 * 0.6},${y1}
            Q ${isLeft ? lMidX : lMidX + rx1 * 0.3},${midY} ${isLeft ? x2L : x2L + rx2 * 0.6},${y2}
            L ${isLeft ? x1L + rx1 * 0.45 : x1R},${y2}
            Q ${isLeft ? lMidX + rx1 * 0.25 : rMidX},${midY} ${isLeft ? x1L + rx1 * 0.45 : x1R},${y1}
            Z
          `}
          fill="black"
          opacity="0.08"
          pointerEvents="none"
        />
      </g>
    );
  };

  // Real-time garment overlays styled perfectly around our curved organic body profile
  const fitOffset = preferredFit === "tight" ? 1.5 : preferredFit === "loose" ? 8 : 4.2;
  const fSh = rSh + fitOffset;
  const fCh = rCh + fitOffset + 0.8;
  const fWaist = rWaist + fitOffset;
  const fHip = rHip + fitOffset;

  const renderTopOutfit = (top: Garment) => {
    const isStriped = top.name.includes("스트라이프") || top.id.includes("stripe") || top.name.includes("stripe");
    const fillValue = isStriped ? "url(#clothingStripePattern)" : top.color;
    const isT = top.svgType === "tshirt";
    const slLen = isT ? 14 : 34;
    const slOffset = isT ? 12 : 28;

    return (
      <g className="transition-all duration-300">
        <path
          d={`
            M ${centerX - 11},${neckY + 2}
            Q ${centerX},${neckY + 7} ${centerX + 11},${neckY + 2}
            L ${centerX + fSh},${shoulderY}
            L ${centerX + fSh + slLen * cosYaw},${shoulderY + slOffset}
            L ${centerX + fSh + (slLen - 7) * cosYaw},${shoulderY + slOffset + 7}
            L ${centerX + fSh - 3},${shoulderY + 15}
            Q ${centerX + fCh + 1.5},${chestY} ${centerX + fWaist},${waistY + 4}
            L ${centerX - fWaist},${waistY + 4}
            Q ${centerX - fCh - 1.5},${chestY} ${centerX - fSh + 3},${shoulderY + 15}
            L ${centerX - fSh - (slLen - 7) * cosYaw},${shoulderY + slOffset + 7}
            L ${centerX - fSh - slLen * cosYaw},${shoulderY + slOffset}
            L ${centerX - fSh},${shoulderY}
            Z
          `}
          fill={fillValue}
          stroke="#000000"
          strokeWidth="2"
          filter="url(#clothesShadow)"
          className="transition-all duration-300 drop-shadow-[2px_3px_0px_rgba(0,0,0,1)]"
        />
        {/* Fabric Creases */}
        <path
          d={`M ${centerX - fWaist * 0.75},${waistY} Q ${centerX + sinYaw * 5},${waistY + 6} ${centerX + fWaist * 0.75},${waistY}`}
          fill="none"
          stroke="black"
          strokeWidth="1.2"
          opacity="0.16"
          strokeLinecap="round"
        />
      </g>
    );
  };

  const renderBottomOutfit = (bottom: Garment) => {
    const color = bottom.color;
    if (bottom.svgType === "skirt") {
      const kneeW = fHip * 1.32;
      return (
        <g className="transition-all duration-300">
          <path
            d={`
              M ${centerX - fWaist},${waistY + 4}
              L ${centerX + fWaist},${waistY + 4}
              L ${centerX + fHip},${hipY + 10}
              L ${centerX + kneeW},${kneeY + 4}
              L ${centerX - kneeW},${kneeY + 4}
              L ${centerX - fHip},${hipY + 10}
              Z
            `}
            fill={color}
            stroke="#000000"
            strokeWidth="2"
            filter="url(#clothesShadow)"
            className="transition-all duration-300 drop-shadow-[2px_3px_0px_rgba(0,0,0,1)]"
          />
          {/* Vertical Pleat Shadows */}
          {[-0.5, -0.2, 0.1, 0.4].map((v, i) => (
            <path
              key={i}
              d={`M ${centerX + fWaist * v},${waistY + 5} Q ${centerX + fHip * v * 1.1},${hipY} ${centerX + kneeW * v},${kneeY + 3}`}
              fill="none"
              stroke="black"
              strokeWidth="1"
              opacity="0.2"
            />
          ))}
        </g>
      );
    }

    const isS = bottom.svgType === "shorts";
    const bottomLegY = isS ? hipY + 34 : ankleY;
    const lLegCenter = centerX - hHalf * 0.44 * cosYaw;
    const rLegCenter = centerX + hHalf * 0.44 * cosYaw;
    const legWidth = hHalf * 0.36 + fitOffset + 0.5;

    return (
      <g className="transition-all duration-300">
        <path
          d={`
            M ${centerX - fWaist},${waistY + 4}
            L ${centerX + fWaist},${waistY + 4}
            Q ${centerX + fHip + 4},${hipY} ${centerX + fHip},${hipY + 15}
            L ${rLegCenter + legWidth},${bottomLegY}
            L ${rLegCenter},${bottomLegY}
            L ${centerX + sinYaw * 5},${hipY + 12}
            L ${lLegCenter},${bottomLegY}
            L ${lLegCenter - legWidth},${bottomLegY}
            Q ${centerX - fHip - 4},${hipY} ${centerX - fHip},${hipY + 15}
            Z
          `}
          fill={color}
          stroke="#000000"
          strokeWidth="2"
          filter="url(#clothesShadow)"
          className="transition-all duration-300 drop-shadow-[2px_3px_0px_rgba(0,0,0,1)]"
        />
        <line x1={centerX + sinYaw * 5} y1={waistY + 4} x2={centerX + sinYaw * 5} y2={hipY + 11} stroke="black" strokeWidth="1.2" opacity="0.3" />
      </g>
    );
  };

  const renderOuterwearOutfit = (outer: Garment) => {
    const color = outer.color;
    const oSh = rSh + fitOffset + 3.8;
    const oCh = rCh + fitOffset + 4.5;
    const oHip = rHip + fitOffset + 5.5;
    const isC = outer.svgType === "coat";
    const bottomY = isC ? kneeY + 18 : hipY + 10;

    return (
      <g className="transition-all duration-300">
        <path
          d={`
            M ${centerX - 16},${neckY - 2}
            Q ${centerX},${neckY + 12} ${centerX + 16},${neckY - 2}
            L ${centerX + oSh},${shoulderY - 3}
            L ${centerX + oSh + 18 * cosYaw},${shoulderY + 32}
            L ${centerX + oSh + 9 * cosYaw},${shoulderY + 36}
            L ${centerX + oSh - 4 * cosYaw},${shoulderY + 20}
            L ${centerX + oHip},${bottomY}
            L ${centerX - oHip},${bottomY}
            L ${centerX - oSh + 4 * cosYaw},${shoulderY + 20}
            L ${centerX - oSh - 9 * cosYaw},${shoulderY + 36}
            L ${centerX - oSh - 18 * cosYaw},${shoulderY + 32}
            L ${centerX - oSh},${shoulderY - 3}
            Z
          `}
          fill={color}
          stroke="#000000"
          strokeWidth="2.2"
          filter="url(#clothesShadow)"
          className="transition-all duration-300 drop-shadow-[2.5px_4px_0px_rgba(0,0,0,1)]"
        />
        {/* Muted collar lapels */}
        <path d={`M ${centerX - 16},${neckY - 2} L ${centerX - 4 + sinYaw * 4},${neckY + 22} L ${centerX - 13},${neckY + 3} Z`} fill="black" opacity="0.14" stroke="black" strokeWidth="0.8" />
        <path d={`M ${centerX + 16},${neckY - 2} L ${centerX + 4 + sinYaw * 4},${neckY + 22} L ${centerX + 13},${neckY + 3} Z`} fill="black" opacity="0.14" stroke="black" strokeWidth="0.8" />
      </g>
    );
  };

  // Joint Position math
  const lHipJointX = centerX - hHalf * 0.44 * cosYaw;
  const rHipJointX = centerX + hHalf * 0.44 * cosYaw;
  const lKneeJointX = centerX - hHalf * 0.41 * cosYaw;
  const rKneeJointX = centerX + hHalf * 0.41 * cosYaw;
  const lAnkleJointX = centerX - hHalf * 0.37 * cosYaw;
  const rAnkleJointX = centerX + hHalf * 0.37 * cosYaw;

  // Active Background config
  const activeBackdrop = BACKDROPS.find(b => b.id === backdrop) || BACKDROPS[0];

  return (
    <div className={`relative flex flex-col w-full h-full rounded-3xl border-2 border-black overflow-hidden select-none select-none transition-all duration-300 ${activeBackdrop.bg}`}>
      
      {/* Background Studio Grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, ${activeBackdrop.line} 1px, transparent 1px), linear-gradient(to bottom, ${activeBackdrop.line} 1px, transparent 1px)`,
          backgroundSize: "16px_16px"
        }}
      />

      {/* Decorative ambient lighting glare glow */}
      <div className={`absolute top-0 inset-x-0 h-44 bg-gradient-to-b ${activeBackdrop.glow} opacity-60 blur-2xl pointer-events-none`} />

      {/* Control bar */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-[9.5px] font-mono tracking-wider uppercase shadow-md rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          입체 고해상도 가상 피팅 페르소나
        </div>
        <div className="flex items-center gap-1.5">
          {/* Launch focused mode workshop */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-black border-2 border-black text-[10px] font-black cursor-pointer rounded-lg shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-[1px] active:shadow-none"
            title="정밀 집중 감상 모드"
          >
            {isFocusMode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3 text-cyan-600" />}
            {isFocusMode ? "집중해제" : "정밀 집중 피팅룸"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-35 transition-all duration-300">
          <div className="relative flex items-center justify-center w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-black/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-black border-r-transparent rounded-full animate-spin" />
            <span className="text-black text-xs font-black animate-pulse font-mono">3D</span>
          </div>
          <h3 className="text-black text-sm font-black tracking-widest uppercase mb-1">실시간 신체 고증 엔진 빌드 중</h3>
          <p className="text-stone-500 text-[11px] animate-pulse font-mono">{analysisStep}</p>
        </div>
      )}

      {/* SVG Canvas for Digital Human */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
        className="relative flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing min-h-[360px] md:min-h-[420px]"
      >
        <svg
          viewBox="0 0 240 380"
          className="w-auto h-[90%] overflow-visible transition-transform duration-300"
          style={{
            transform: `scale(${isFocusMode ? zoomScale * 1.15 : zoomScale}) translateY(${panY}px)`
          }}
        >
          <defs>
            {/* Realistically mapped human skin gradients */}
            <linearGradient id="bodyOrganicGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={activeSkin.shadow} />
              <stop offset="30%" stopColor={activeSkin.bright} />
              <stop offset="70%" stopColor={activeSkin.base} />
              <stop offset="100%" stopColor={activeSkin.shadow} />
            </linearGradient>

            <radialGradient id="faceShadingGrad" cx="45%" cy="45%" r="60%">
              <stop offset="0%" stopColor={activeSkin.bright} />
              <stop offset="75%" stopColor={activeSkin.base} />
              <stop offset="100%" stopColor={activeSkin.shadow} />
            </radialGradient>

            <linearGradient id="lipsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4d4d" />
              <stop offset="50%" stopColor={activeSkin.lip} />
              <stop offset="100%" stopColor="#c62828" />
            </linearGradient>

            <filter id="soft3DShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="3" dy="4" stdDeviation="3.5" floodOpacity="0.22" />
            </filter>
            <filter id="clothesShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="2.2" dy="3.2" stdDeviation="2.2" floodOpacity="0.28" />
            </filter>

            <pattern id="clothingStripePattern" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="#ffffff" />
              <rect width="5" height="12" fill={selectedTop?.color || "#0284c7"} opacity="0.88" />
            </pattern>
          </defs>

          {/* Render glowing wireframe guidelines if requested */}
          {avatarReady && showMetrics && (
            <g opacity="0.16">
              <ellipse cx={centerX} cy={shoulderY} rx={rSh} ry={3.5} fill="none" stroke="black" strokeWidth="1.2" strokeDasharray="3 3" />
              <ellipse cx={centerX} cy={chestY} rx={rCh} ry={3.5} fill="none" stroke="black" strokeWidth="1.2" strokeDasharray="3 3" />
              <ellipse cx={centerX} cy={waistY} rx={rWaist} ry={3.5} fill="none" stroke="black" strokeWidth="1.2" strokeDasharray="3 3" />
              <ellipse cx={centerX} cy={hipY} rx={rHip * 0.9} ry={3.5} fill="none" stroke="black" strokeWidth="1.2" strokeDasharray="3 3" />
            </g>
          )}

          {/* Digital Human Mesh Body Structure */}
          {avatarReady && (
            <g filter="url(#soft3DShadow)">
              {/* LEG 1: Left Thigh and calf */}
              {drawOrganicLimb(hipY, kneeY, lHipJointX, lKneeJointX, hHalf * 0.43, hHalf * 0.36, true)}
              {drawOrganicLimb(kneeY, ankleY, lKneeJointX, lAnkleJointX, hHalf * 0.36, hHalf * 0.27, true)}
              
              {/* Left Shoe (Premium Suede Boot) */}
              <path
                d={`
                  M ${lAnkleJointX - 5.5 * cosYaw + 3 * sinYaw},${ankleY}
                  L ${lAnkleJointX + 5.5 * cosYaw + 3 * sinYaw},${ankleY}
                  L ${lAnkleJointX + 4.5 * cosYaw + 12 * sinYaw},${ankleY + 9}
                  L ${lAnkleJointX - 8.5 * cosYaw - 1.5 * sinYaw},${ankleY + 7}
                  Z
                `}
                fill="#3c2f2f"
                stroke="#1c1917"
                strokeWidth="1.8"
              />

              {/* LEG 2: Right Thigh and calf */}
              {drawOrganicLimb(hipY, kneeY, rHipJointX, rKneeJointX, hHalf * 0.43, hHalf * 0.36, false)}
              {drawOrganicLimb(kneeY, ankleY, rKneeJointX, rAnkleJointX, hHalf * 0.36, hHalf * 0.27, false)}
              
              {/* Right Shoe (Premium Suede Boot) */}
              <path
                d={`
                  M ${rAnkleJointX - 5.5 * cosYaw - 3 * sinYaw},${ankleY}
                  L ${rAnkleJointX + 5.5 * cosYaw - 3 * sinYaw},${ankleY}
                  L ${rAnkleJointX + 8.5 * cosYaw + 1.5 * sinYaw},${ankleY + 7}
                  L ${rAnkleJointX - 4.5 * cosYaw - 12 * sinYaw},${ankleY + 9}
                  Z
                `}
                fill="#3c2f2f"
                stroke="#1c1917"
                strokeWidth="1.8"
              />

              {/* ORGANIC HUMAN TORSO: Rendered with smooth elegant curves (no boxy lines!) */}
              <path
                d={`
                  M ${neckL},${neckY}
                  Q ${neckL - 1.5},${neckY + 11} ${shL},${shoulderY}
                  C ${shL - 3.5},${shoulderY + 14} ${chL - 4},${chestY} ${chL},${chestY}
                  C ${chL + 1},${chestY + 18} ${wtL - 1.8},${waistY - 8} ${wtL},${waistY}
                  Q ${wtL + 1.8},${waistY + 20} ${hipL},${hipY}
                  L ${hipR},${hipY}
                  Q ${wtR - 1.8},${waistY + 20} ${wtR},${waistY}
                  C ${wtR + 1.8},${waistY - 8} ${chR - 1},${chestY + 18} ${chR},${chestY}
                  C ${chR + 4},${chestY} ${shR + 3.5},${shoulderY + 14} ${shR},${shoulderY}
                  Q ${neckR + 1.5},${neckY + 11} ${neckR},${neckY}
                  Z
                `}
                fill="url(#bodyOrganicGrad)"
                stroke="#1c1917"
                strokeWidth="2"
              />

              {/* Clavicles (쇄골라인 고증) */}
              <path d={`M ${centerX - 22 * cosYaw},${neckY + 9} Q ${centerX - 10 * cosYaw},${neckY + 12} ${centerX - 1.5 * cosYaw},${neckY + 9.5}`} fill="none" stroke="#1c1917" strokeWidth="1" opacity="0.22" strokeLinecap="round" />
              <path d={`M ${centerX + 1.5 * cosYaw},${neckY + 9.5} Q ${centerX + 10 * cosYaw},${neckY + 12} ${centerX + 22 * cosYaw},${neckY + 9}`} fill="none" stroke="#1c1917" strokeWidth="1" opacity="0.22" strokeLinecap="round" />

              {/* Chest anatomy contours */}
              <circle cx={centerX - 10 * cosYaw} cy={chestY + 4} r={gender === "female" ? 9 : 7} fill="none" stroke="#1c1917" strokeWidth="1.2" opacity="0.12" />
              <circle cx={centerX + 10 * cosYaw} cy={chestY + 4} r={gender === "female" ? 9 : 7} fill="none" stroke="#1c1917" strokeWidth="1.2" opacity="0.12" />

              {/* Belly button */}
              <ellipse cx={centerX + sinYaw * 10} cy={waistY + 22} rx="1.5" ry="2" fill="black" opacity="0.18" />

              {/* Thigh center gap definition */}
              <line x1={centerX + sinYaw * 10} y1={hipY} x2={centerX + sinYaw * 10} y2={hipY + 14} stroke="black" strokeWidth="1" opacity="0.12" />

              {/* ARM 1: Left Shoulder, biceps, forearm */}
              {drawOrganicLimb(shoulderY, shoulderY + 22, shL, shL - 10 * cosYaw, sHalf * 0.35, sHalf * 0.3, true)}
              {drawOrganicLimb(shoulderY + 22, shoulderY + 44, shL - 10 * cosYaw, shL - 16 * cosYaw, sHalf * 0.3, sHalf * 0.24, true)}

              {/* ARM 2: Right Shoulder, biceps, forearm */}
              {drawOrganicLimb(shoulderY, shoulderY + 22, shR, shR + 10 * cosYaw, sHalf * 0.35, sHalf * 0.3, false)}
              {drawOrganicLimb(shoulderY + 22, shoulderY + 44, shR + 10 * cosYaw, shR + 16 * cosYaw, sHalf * 0.3, sHalf * 0.24, false)}

              {/* Neck Cylinder */}
              <rect
                x={centerX - 5.5}
                y={neckY - 6.5}
                width={11}
                height={12}
                rx={1}
                fill="url(#bodyOrganicGrad)"
                stroke="#1c1917"
                strokeWidth="1.6"
              />

              {/* HIGH-FIDELITY HUMAN FACE SHAPE */}
              <path
                d={`
                  M ${centerX - 13.5},${headTopY + 2}
                  C ${centerX - 15.5},${headTopY - 6} ${centerX + 15.5},${headTopY - 6} ${centerX + 13.5},${headTopY + 2}
                  C ${centerX + 14.8},${headTopY + 9.5} ${centerX + 12.8},${headTopY + 19.5} ${centerX + 9.5},${headTopY + 24.5}
                  Q ${centerX},${headTopY + 31} ${centerX - 9.5},${headTopY + 24.5}
                  C ${centerX - 12.8},${headTopY + 19.5} ${centerX - 14.8},${headTopY + 9.5} ${centerX - 13.5},${headTopY + 2}
                  Z
                `}
                fill="url(#faceShadingGrad)"
                stroke="#1c1917"
                strokeWidth="2"
              />

              {/* Eye positioning based on Rotation */}
              {(() => {
                const eyeY = headTopY + 11.2;
                const eyeGap = 4.8;
                const look = sinYaw * 1.5;
                const lx = centerX - eyeGap + sinYaw * 6;
                const rx = centerX + eyeGap + sinYaw * 6;

                // Adjust eyebrows based on expression preset
                let browYOffset = 0;
                let browCurvature = "Q";
                if (expression === "smile") browYOffset = -1.0;
                if (expression === "proud") browYOffset = -1.8;

                return (
                  <g>
                    {/* Eyebrows */}
                    <path
                      d={`M ${lx - 4.5},${headTopY + 6.8 + browYOffset} Q ${lx - 1.2},${headTopY + 4.2 + browYOffset} ${lx + 3.8},${headTopY + 6.2 + browYOffset}`}
                      fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"
                    />
                    <path
                      d={`M ${rx - 3.8},${headTopY + 6.2 + browYOffset} Q ${rx + 1.2},${headTopY + 4.2 + browYOffset} ${rx + 4.5},${headTopY + 6.8 + browYOffset}`}
                      fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"
                    />

                    {/* Almond Eyes Background */}
                    <ellipse cx={lx} cy={eyeY} rx={4.2} ry={2} fill="#ffffff" />
                    <ellipse cx={rx} cy={eyeY} rx={4.2} ry={2} fill="#ffffff" />

                    {/* Eyelids & Lashes */}
                    <path d={`M ${lx - 4.5},${eyeY} Q ${lx},${eyeY - 2.8} ${lx + 4.5},${eyeY}`} fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round" />
                    <path d={`M ${rx - 4.5},${eyeY} Q ${rx},${eyeY - 2.8} ${rx + 4.5},${eyeY}`} fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round" />

                    {/* Eye Iris with Shimmer Reflection */}
                    <circle cx={lx + look} cy={eyeY} r="2.1" fill="#4d2f2f" />
                    <circle cx={lx + look} cy={eyeY} r="1" fill="#000000" />
                    <circle cx={lx + look - 0.7} cy={eyeY - 0.7} r="0.6" fill="#ffffff" />

                    <circle cx={rx + look} cy={eyeY} r="2.1" fill="#4d2f2f" />
                    <circle cx={rx + look} cy={eyeY} r="1" fill="#000000" />
                    <circle cx={rx + look - 0.7} cy={eyeY - 0.7} r="0.6" fill="#ffffff" />

                    {/* Under-Eye creases */}
                    <path d={`M ${lx - 3.8},${eyeY + 2.4} Q ${lx},${eyeY + 3.4} ${lx + 3.8},${eyeY + 2.4}`} fill="none" stroke="black" strokeWidth="0.8" opacity="0.12" />
                    <path d={`M ${rx - 3.8},${eyeY + 2.4} Q ${rx},${eyeY + 3.4} ${rx + 3.8},${eyeY + 2.4}`} fill="none" stroke="black" strokeWidth="0.8" opacity="0.12" />
                  </g>
                );
              })()}

              {/* Realistic 3D Nose Bridge & base shadow */}
              {(() => {
                const nX = centerX + sinYaw * 6;
                const nY = headTopY + 16;
                return (
                  <g>
                    <path d={`M ${nX - 0.6},${headTopY + 10} Q ${nX - 1.5},${nY + 1} ${nX - 1},${nY + 3.2}`} fill="none" stroke="black" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
                    <path d={`M ${nX - 1.6},${nY + 3.2} Q ${nX},${nY + 4.4} ${nX + 1.2},${nY + 3.2}`} fill="none" stroke="black" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" />
                  </g>
                );
              })()}

              {/* Expressions Mapping (Lip structure matching the reference photo) */}
              {(() => {
                const lipX = centerX + sinYaw * 6;
                const lipY = headTopY + 21;

                if (expression === "smile") {
                  return (
                    <g>
                      {/* Open cheerful lips showing teeth */}
                      <path d={`M ${lipX - 5},${lipY} Q ${lipX},${lipY + 4} ${lipX + 5},${lipY} Z`} fill="#d32f2f" stroke="#000" strokeWidth="0.8" />
                      <path d={`M ${lipX - 4.2},${lipY + 0.4} Q ${lipX},${lipY + 2.2} ${lipX + 4.2},${lipY + 0.4} Z`} fill="white" />
                      <path d={`M ${lipX - 5.5},${lipY} Q ${lipX},${lipY - 1.8} ${lipX + 5.5},${lipY}`} fill="none" stroke="#222" strokeWidth="1.6" strokeLinecap="round" />
                    </g>
                  );
                }
                if (expression === "proud") {
                  return (
                    <g>
                      {/* Charming asymmetrical proud half-smile */}
                      <path d={`M ${lipX - 4.5},${lipY + 0.5} Q ${lipX},${lipY + 1.5} ${lipX + 4},${lipY - 1.5}`} fill="none" stroke="#1c1917" strokeWidth="2.1" strokeLinecap="round" />
                      <ellipse cx={lipX + 0.5} cy={lipY + 1} rx="2.5" ry="0.6" fill={activeSkin.lip} opacity="0.7" />
                    </g>
                  );
                }
                if (expression === "natural") {
                  return (
                    <g>
                      {/* Soft pillowy warm default lips */}
                      <ellipse cx={lipX} cy={lipY + 0.8} rx="3" ry="1" fill={activeSkin.lip} opacity="0.8" />
                      <path d={`M ${lipX - 4},${lipY} Q ${lipX},${lipY + 1} ${lipX + 4},${lipY}`} fill="none" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" />
                    </g>
                  );
                }
                // Default: Chic / Sophisticated model look (from image)
                return (
                  <g>
                    <path d={`M ${lipX - 4.2},${lipY} Q ${lipX},${lipY - 0.8} ${lipX + 4.2},${lipY}`} fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" />
                    <path d={`M ${lipX - 4.2},${lipY} Q ${lipX},${lipY + 2} ${lipX + 4.2},${lipY} Z`} fill={activeSkin.lip} opacity="0.9" stroke="black" strokeWidth="0.8" />
                  </g>
                );
              })()}

              {/* HAIR SYSTEM (Elegant styling framing cheekbones accurately) */}
              {(() => {
                if (hairPreset === "waves") {
                  return (
                    <g>
                      {/* Cascading Glamour Waves around shoulders */}
                      <path d={`M ${centerX - 16},${headTopY - 2} Q ${centerX - 24},${headTopY + 18} ${centerX - 18},${headTopY + 36}`} fill="none" stroke="#1c1917" strokeWidth="5.5" strokeLinecap="round" />
                      <path d={`M ${centerX + 16},${headTopY - 2} Q ${centerX + 24},${headTopY + 18} ${centerX + 18},${headTopY + 36}`} fill="none" stroke="#1c1917" strokeWidth="5.5" strokeLinecap="round" />
                      <path d={`M ${centerX - 15.5},${headTopY + 10} C ${centerX - 16},${headTopY - 4} ${centerX + 16},${headTopY - 4} ${centerX + 15.5},${headTopY + 10} Q ${centerX},${headTopY - 1} ${centerX - 15.5},${headTopY + 10} Z`} fill="#1c1917" />
                    </g>
                  );
                }
                if (hairPreset === "updo") {
                  return (
                    <g>
                      {/* High top updo bun */}
                      <circle cx={centerX} cy={headTopY - 7} r="7" fill="#1c1917" stroke="black" strokeWidth="1.2" />
                      <path d={`M ${centerX - 15},${headTopY + 10} C ${centerX - 16},${headTopY - 3} ${centerX + 16},${headTopY - 3} ${centerX + 15},${headTopY + 10} Z`} fill="#1c1917" />
                    </g>
                  );
                }
                // Default: "braid" - Sleek Middle-Part braid cascading behind (exactly like her photograph)
                return (
                  <g>
                    {/* Symmetrical cascading braids draping behind */}
                    <path d={`M ${centerX - 13.5},${headTopY + 17} Q ${centerX - 18},${headTopY + 32} ${centerX - 13},${neckY + 22}`} fill="none" stroke="#101010" strokeWidth="4.5" strokeLinecap="round" />
                    <path d={`M ${centerX + 13.5},${headTopY + 17} Q ${centerX + 18},${headTopY + 32} ${centerX + 13},${neckY + 22}`} fill="none" stroke="#101010" strokeWidth="4.5" strokeLinecap="round" />
                    
                    {/* Braid horizontal crease details */}
                    <path d={`M ${centerX - 15},${headTopY + 22} L ${centerX - 17},${headTopY + 25}`} stroke="#444" strokeWidth="1" />
                    <path d={`M ${centerX + 15},${headTopY + 22} L ${centerX + 17},${headTopY + 25}`} stroke="#444" strokeWidth="1" />

                    {/* Solid parted hair scalp cap */}
                    <path
                      d={`
                        M ${centerX - 15},${headTopY + 10}
                        C ${centerX - 16.5},${headTopY - 4} ${centerX + 16.5},${headTopY - 4} ${centerX + 15},${headTopY + 10}
                        Q ${centerX},${headTopY + 1} ${centerX - 15},${headTopY + 10}
                        Z
                      `}
                      fill="#1c1917"
                      stroke="#000"
                      strokeWidth="1.2"
                    />
                    {/* Sharp crisp middle parting line */}
                    <line x1={centerX} y1={headTopY - 4} x2={centerX} y2={headTopY + 3} stroke="#3d332d" strokeWidth="1" />
                  </g>
                );
              })()}

              {/* Chic round metallic eyeglasses (Gold rimmed style as on image) */}
              {showGlasses && (
                <g>
                  {/* Left frame */}
                  <rect x={centerX - 4.4 * 2 + sinYaw * 6} y={headTopY + 8.2} width="8" height="5.5" rx="2" fill="rgba(255,255,255,0.2)" stroke="#ccae62" strokeWidth="1.2" />
                  {/* Right frame */}
                  <rect x={centerX + 0.4 + sinYaw * 6} y={headTopY + 8.2} width="8" height="5.5" rx="2" fill="rgba(255,255,255,0.2)" stroke="#ccae62" strokeWidth="1.2" />
                  {/* Center bridge */}
                  <line x1={centerX - 0.4 + sinYaw * 6} y1={headTopY + 11} x2={centerX + 0.4 + sinYaw * 6} y2={headTopY + 11} stroke="#ccae62" strokeWidth="1.2" />
                  {/* Outer temples */}
                  <line x1={centerX - 8.4 + sinYaw * 6} y1={headTopY + 10.5} x2={centerX - 13.5} y2={headTopY + 11.5} stroke="#ccae62" strokeWidth="0.8" />
                  <line x1={centerX + 8.4 + sinYaw * 6} y1={headTopY + 10.5} x2={centerX + 13.5} y2={headTopY + 11.5} stroke="#ccae62" strokeWidth="0.8" />
                </g>
              )}
            </g>
          )}

          {/* Skeletons annotations overlay */}
          {avatarReady && showMetrics && (
            <g className="transition-all duration-200">
              {/* Shoulder label */}
              <g transform={`translate(${centerX}, ${shoulderY - 11})`}>
                <rect x="-35" y="-7" width="70" height="13" rx="3.5" fill="black" className="opacity-90" />
                <text x="0" y="2" textAnchor="middle" className="fill-white text-[7px] font-sans font-black tracking-wider uppercase">
                  어깨 {Math.round(shoulderWidth * 0.95)}cm
                </text>
              </g>

              {/* Waist label */}
              <g transform={`translate(${centerX}, ${waistY - 9})`}>
                <rect x="-35" y="-7" width="70" height="13" rx="3.5" fill="black" className="opacity-90" />
                <text x="0" y="2" textAnchor="middle" className="fill-white text-[7px] font-sans font-black tracking-wider uppercase">
                  허리 {waistSize}인치
                </text>
              </g>
            </g>
          )}

          {/* Apparel Layout layers painted on top of physical skin boundaries */}
          {avatarReady && (
            <g className="transition-all duration-300">
              {selectedBottom && renderBottomOutfit(selectedBottom)}
              {selectedTop && renderTopOutfit(selectedTop)}
              {selectedOuterwear && renderOuterwearOutfit(selectedOuterwear)}
            </g>
          )}
        </svg>
      </div>

      {/* Rotation hint text */}
      {avatarReady && !loading && (
        <div className="absolute bottom-[66px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-stone-900 text-white rounded-full text-[9px] font-mono opacity-80 shadow">
          <RotateCw className="w-2.5 h-2.5 text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
          드래그하여 3D 좌우 360° 자연스러운 두께 회전
        </div>
      )}

      {/* Primary specs readout */}
      {avatarReady && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-stone-50 border-2 border-black rounded-xl p-2 text-[10px] font-mono text-black z-10 shadow-sm">
          <div className="flex flex-col text-center flex-1">
            <span className="text-[8px] text-gray-400 uppercase">키</span>
            <span className="font-extrabold">{height}cm</span>
          </div>
          <div className="h-4 w-px bg-black" />
          <div className="flex flex-col text-center flex-1">
            <span className="text-[8px] text-gray-400 uppercase">체중</span>
            <span className="font-extrabold">{weight}kg</span>
          </div>
          <div className="h-4 w-px bg-black" />
          <div className="flex flex-col text-center flex-1">
            <span className="text-[8px] text-gray-400 uppercase">추천 핏</span>
            <span className="font-extrabold text-red-600">
              {preferredFit === "tight" ? "슬림핏 (92%)" : preferredFit === "loose" ? "루즈핏 (120%)" : "레귤러핏 (105%)"}
            </span>
          </div>
        </div>
      )}

      {/* FASHION CUSTOMIZER SUB-PANEL: Precision Focus Mode Overlay */}
      {isFocusMode && (
        <div className="absolute inset-y-0 right-0 w-[240px] bg-white/95 backdrop-blur-md border-l-2 border-black p-4 z-20 flex flex-col gap-4 overflow-y-auto scrollbar-thin transition-all duration-300 shadow-2xl">
          <div className="border-b-2 border-black pb-1.5 flex items-center justify-between">
            <span className="text-black font-black text-[10px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              아바타 정밀 스튜디오
            </span>
            <button 
              onClick={() => setIsFocusMode(false)}
              className="text-stone-400 hover:text-black font-bold text-[9px]"
            >
              닫기
            </button>
          </div>

          {/* 1. Zoom and Pan Controls */}
          <div className="space-y-1.5">
            <span className="text-stone-500 font-extrabold text-[9px] uppercase tracking-wider block">뷰포트 확대 / 상하 이동</span>
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] font-mono w-7">확대:</span>
              <input 
                type="range" min="0.8" max="2.0" step="0.1" 
                value={zoomScale} onChange={(e) => setZoomScale(parseFloat(e.target.value))} 
                className="flex-1 accent-black h-1 rounded"
              />
              <span className="text-[8.5px] font-bold font-mono w-5">{Math.round(zoomScale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] font-mono w-7">위치:</span>
              <input 
                type="range" min="-60" max="60" step="5" 
                value={panY} onChange={(e) => setPanY(parseInt(e.target.value))} 
                className="flex-1 accent-black h-1 rounded"
              />
              <span className="text-[8.5px] font-bold font-mono w-5">{panY}</span>
            </div>
          </div>

          {/* 2. Skin Tones Selector */}
          <div className="space-y-1.5">
            <span className="text-stone-500 font-extrabold text-[9px] uppercase tracking-wider block flex items-center gap-1">
              <Palette className="w-2.5 h-2.5 text-cyan-500" />
              실제 인체 피부톤 고증
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {SKIN_TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSkinTone(t.id)}
                  style={{ backgroundColor: t.base }}
                  className={`h-7 rounded-md border-2 transition-transform cursor-pointer ${
                    skinTone === t.id ? "border-black scale-105 shadow-[1px_1px_0px_rgba(0,0,0,1)]" : "border-stone-200"
                  }`}
                  title={t.label}
                />
              ))}
            </div>
          </div>

          {/* 3. Hair Presets */}
          <div className="space-y-1.5">
            <span className="text-stone-500 font-extrabold text-[9px] uppercase tracking-wider block">헤어스타일 믹스</span>
            <div className="flex flex-col gap-1">
              {HAIR_PRESETS.map(h => (
                <button
                  key={h.id}
                  onClick={() => setHairPreset(h.id)}
                  className={`text-left px-2 py-1.5 border rounded-lg text-[9px] font-medium transition-all cursor-pointer ${
                    hairPreset === h.id ? "bg-black text-white border-black" : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200"
                  }`}
                >
                  {h.label}
                  {h.id === "braid" && " 👑"}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Facial Expressions */}
          <div className="space-y-1.5">
            <span className="text-stone-500 font-extrabold text-[9px] uppercase tracking-wider block flex items-center gap-1">
              <Eye className="w-2.5 h-2.5 text-pink-500" />
              인간형 감정 표정 구현
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {EXPRESSIONS.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setExpression(ex.id)}
                  className={`px-1.5 py-1.5 border rounded-md text-[8.5px] font-black cursor-pointer text-center ${
                    expression === ex.id ? "bg-black text-white border-black" : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-stone-700"
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Lighting / Backdrop Preset */}
          <div className="space-y-1.5">
            <span className="text-stone-500 font-extrabold text-[9px] uppercase tracking-wider block flex items-center gap-1">
              <Sun className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
              런웨이 아틀리에 조명
            </span>
            <div className="flex flex-col gap-1">
              {BACKDROPS.map(bd => (
                <button
                  key={bd.id}
                  onClick={() => setBackdrop(bd.id)}
                  className={`text-left px-2 py-1.5 border rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                    backdrop === bd.id ? "bg-black text-white border-black" : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-stone-700"
                  }`}
                >
                  {bd.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Functional Toggles */}
          <div className="border-t border-stone-100 pt-3 flex flex-col gap-2">
            <label className="flex items-center justify-between cursor-pointer text-[9px] font-bold text-stone-700">
              <span className="flex items-center gap-1">👓 패션 선글라스 안경 착용</span>
              <input 
                type="checkbox" checked={showGlasses} onChange={(e) => setShowGlasses(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-black accent-black cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-[9px] font-bold text-stone-700">
              <span className="flex items-center gap-1">📏 아바타 위 신체 수치선 표시</span>
              <input 
                type="checkbox" checked={showMetrics} onChange={(e) => setShowMetrics(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-black accent-black cursor-pointer"
              />
            </label>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-[8.5px] text-stone-500 leading-relaxed font-mono">
            💡 본 스튜디오는 무신사 컬렉션 실측정보를 실시간으로 가상 렌더링에 반영합니다.
          </div>
        </div>
      )}
    </div>
  );
}
