/**
 * 카드뉴스 템플릿 정의
 */

export interface CardNewsTemplate {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  layout: "centered" | "top" | "bottom";
}

export const CARD_NEWS_TEMPLATES: CardNewsTemplate[] = [
  {
    id: "minimal",
    name: "미니멀",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    accentColor: "#3B82F6",
    fontFamily: "Inter",
    layout: "centered",
  },
  {
    id: "dark",
    name: "다크",
    backgroundColor: "#1F2937",
    textColor: "#F9FAFB",
    accentColor: "#60A5FA",
    fontFamily: "Inter",
    layout: "centered",
  },
  {
    id: "warm",
    name: "따뜻한",
    backgroundColor: "#FEF3C7",
    textColor: "#78350F",
    accentColor: "#F59E0B",
    fontFamily: "Inter",
    layout: "centered",
  },
  {
    id: "cool",
    name: "시원한",
    backgroundColor: "#DBEAFE",
    textColor: "#1E3A8A",
    accentColor: "#3B82F6",
    fontFamily: "Inter",
    layout: "centered",
  },
  {
    id: "elegant",
    name: "우아한",
    backgroundColor: "#F3F4F6",
    textColor: "#111827",
    accentColor: "#8B5CF6",
    fontFamily: "Inter",
    layout: "centered",
  },
  {
    id: "vibrant",
    name: "활기찬",
    backgroundColor: "#FCE7F3",
    textColor: "#831843",
    accentColor: "#EC4899",
    fontFamily: "Inter",
    layout: "centered",
  },
];

export function getTemplateById(id: string): CardNewsTemplate {
  return (
    CARD_NEWS_TEMPLATES.find((t) => t.id === id) || CARD_NEWS_TEMPLATES[0]
  );
}

