export type LiveWeather = {
  label: string;
  city: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  tempC: number | null;
  humidity: number | null;
  rainMm: number | null;
  rainTodayMm: number | null;
  windKmh: number | null;
  code: number | null;
  spokenHi: string;
  spokenEn: string;
};

function wmoPhrase(code: number | null): { hi: string; en: string } {
  if (code == null) return { hi: "", en: "" };
  if (code === 0) return { hi: "aasmaan saaf hai", en: "the sky is clear" };
  if (code <= 3) return { hi: "halka badal hai", en: "it is partly cloudy" };
  if (code <= 48) return { hi: "kohra ya dhund hai", en: "it is foggy" };
  if (code <= 67) return { hi: "baarish ho rahi hai", en: "it is raining" };
  if (code <= 77) return { hi: "os ya halki barf hai", en: "there is light ice or drizzle" };
  if (code <= 82) return { hi: "tez baarish ho sakti hai", en: "rain may be heavy" };
  if (code <= 99) return { hi: "aandhi-toofan ka chance hai", en: "there may be a thunderstorm" };
  return { hi: "", en: "" };
}

export async function fetchLiveWeather(place: string): Promise<LiveWeather | null> {
  const q = place.trim();
  if (!q || q.length < 2) return null;
  const geoUrl =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}` +
    `&count=5&language=en&country=IN`;
  const geoRes = await fetch(geoUrl, { cache: "no-store" });
  if (!geoRes.ok) return null;
  const geo = (await geoRes.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      admin1?: string;
      admin2?: string;
      admin3?: string;
    }>;
  };
  const hit = geo.results?.[0];
  if (!hit) return null;

  const wxUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
    `&daily=precipitation_sum&forecast_days=1&timezone=Asia%2FKolkata`;
  const wxRes = await fetch(wxUrl, { cache: "no-store" });
  if (!wxRes.ok) return null;
  const wx = (await wxRes.json()) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      precipitation?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
    daily?: { precipitation_sum?: number[] };
  };
  const c = wx.current ?? {};
  const rainToday = wx.daily?.precipitation_sum?.[0] ?? null;
  const phrase = wmoPhrase(c.weather_code ?? null);
  const city = hit.name;
  const district = hit.admin2 || hit.admin3 || "";
  const state = hit.admin1 || "";
  const label = [city, district, state].filter(Boolean).join(", ");
  const temp = c.temperature_2m ?? null;
  const partsHi = [
    `${city} mein`,
    temp != null ? `abhi lagbhag ${Math.round(temp)} degree hai` : "",
    phrase.hi,
    rainToday != null && rainToday >= 1
      ? `aaj lagbhag ${rainToday.toFixed(0)} mm baarish ho chuki hai`
      : "",
  ].filter(Boolean);
  const partsEn = [
    `In ${city}`,
    temp != null ? `it is about ${Math.round(temp)} degrees` : "",
    phrase.en,
    rainToday != null && rainToday >= 1 ? `with about ${rainToday.toFixed(0)} mm rain today` : "",
  ].filter(Boolean);

  return {
    label,
    city,
    district,
    state,
    lat: hit.latitude,
    lon: hit.longitude,
    tempC: temp ?? null,
    humidity: c.relative_humidity_2m ?? null,
    rainMm: c.precipitation ?? null,
    rainTodayMm: rainToday,
    windKmh: c.wind_speed_10m ?? null,
    code: c.weather_code ?? null,
    spokenHi: `${partsHi.join(", ")}.`,
    spokenEn: `${partsEn.join(", ")}.`,
  };
}
