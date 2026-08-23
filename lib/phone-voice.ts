/** Vobiz TTS/STT settings for KrishiSaathi outbound — do not regress. */

/** Indian Hindi TTS (AWS Polly). WOMAN+hi-IN is invalid and falls back to en-US. */
export const VOBIZ_TTS_VOICE = "Polly.Aditi";

/** Hindi speech recognition on PSTN legs. */
export const VOBIZ_STT_LANGUAGE = "hi-IN";

export const VOBIZ_GATHER_HINTS =
  "namaste,naam,mera,main,gaon,shahar,district,zila,jila,state,rajya," +
  "fasal,gehun,kapas,dhan,ganna,mausam,baarish,keeda,paani,spray,urea," +
  "theek,haan,nahi,ji,expert,madad,problem,pakur,jharkhand,nashik,pune";

export const KRISHI_ANSWER_GREETING =
  "नमस्ते, मैं कृषि साथी हूँ। मैं आपकी खेती से जुड़ी समस्याओं में मदद कर सकता हूँ। सबसे पहले आपका नाम क्या है?";

export const KRISHI_NO_HEAR =
  "आवाज़ साफ़ नहीं आई। कृपया दोबारा बोलिए।";
