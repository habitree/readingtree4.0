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
    id: "default",
    name: "기본",
    backgroundColor: "#F0FDF4",
    textColor: "#166534",
    accentColor: "#22C55E",
    fontFamily: "Inter",
    layout: "centered",
  },
  {
    id: "minimal",
    name: "심플",
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
];

export function getTemplateById(id: string): CardNewsTemplate {
  return (
    CARD_NEWS_TEMPLATES.find((t) => t.id === id) || CARD_NEWS_TEMPLATES[0]
  );
}

