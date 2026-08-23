/** Client-safe crop inference from Hindi/Hinglish text. */

export function inferCropFromText(text: string): string {
  const t = text.toLowerCase();
  if (/\b(cotton|kapas)\b/i.test(t)) return "cotton";
  if (/\b(wheat|gehun|gehu)\b/i.test(t)) return "wheat";
  if (/\b(rice|dhan|paddy|chawal)\b/i.test(t)) return "rice";
  if (/\b(onion|pyaz|pyaaz)\b/i.test(t)) return "onion";
  if (/\b(tomato|tamatar)\b/i.test(t)) return "tomato";
  if (/\b(maize|corn|makka|makki)\b/i.test(t)) return "maize";
  if (/\b(mustard|sarson)\b/i.test(t)) return "mustard";
  if (/\b(sugarcane|ganna)\b/i.test(t)) return "sugarcane";
  if (/\b(soybean|soya)\b/i.test(t)) return "soybean";
  if (/\b(potato|aloo)\b/i.test(t)) return "potato";
  if (/\b(chana|chickpea|gram)\b/i.test(t)) return "chickpea";
  if (/\b(moong|dal|pulse|tur|arhar)\b/i.test(t)) return "pulses";
  return "";
}
