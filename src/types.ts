export type GarmentCategory = "top" | "bottom" | "outerwear";

export interface Garment {
  id: string;
  name: string;
  category: GarmentCategory;
  color: string;
  description: string;
  // Visual representation specs for our interactive 3D-like customizer
  svgType: "tshirt" | "sweater" | "hoodie" | "shirt" | "jeans" | "shorts" | "skirt" | "coat" | "jacket";
  fitMultiplier: number; // impact of size on visuals
  imageUrl?: string; // real image representation
  musinsaUrl?: string; // real store link
  price?: string; // formatted price
  brand?: string; // creator brand
}

export interface BodyProportions {
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
  legs: number;
}

export interface FitAnalysis {
  tops: "S" | "M" | "L" | "XL" | "XXL";
  bottoms: "S" | "M" | "L" | "XL" | "XXL";
  fitMatchScore: number;
}

export interface AnalysisResult {
  bodyType: string;
  proportions: BodyProportions;
  fitAnalysis: FitAnalysis;
  styleVerdict: string;
  fittingTips: string[];
  isFallback: boolean;
}

export interface UserMeasurements {
  gender: "male" | "female" | "unisex";
  height: number; // 140 to 210 cm
  weight: number; // 40 to 140 kg
  shoulderWidth: number; // slider index (e.g. 35 to 60)
  waistSize: number; // inches (24 to 48)
  hipSize: number; // cm (70 to 130)
  preferredFit: "tight" | "regular" | "loose";
  image: string | null; // base64 string
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
