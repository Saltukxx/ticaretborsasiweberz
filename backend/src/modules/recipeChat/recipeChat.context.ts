import recipeContext from "../../data/kadayif-dolmasi-gemini-context.json" with {
  type: "json",
};

type RecipeStepContext = {
  id: number;
  title: string;
  description: string;
  detail?: string;
  tips?: string[];
  ingredients?: string[];
  videoTimestamp?: number;
};

const RECIPE_STEPS = recipeContext.steps as RecipeStepContext[];

export type RecipeVideoStateInput = {
  currentStep: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  awaitingContinue: boolean;
};

const geminiRecipeNarratorInstruction = `Sen, Erzurum Ticaret Borsası'nın dijital platformunda görev yapan bir kültürel anlatıcısın. Yalnızca "Kadayıf Dolması" coğrafi işaretli ürünü, Erzurum mutfak kültürü ve bu ürünün tescili ile ilgili sorulara yanıt verirsin.

Kişiliğin:
- Resmi ama sıcak Türkçe; emoji kullanma
- Erzurum kültürel mirasına saygılı; halka yakın ama doğru dil
- Sorulara sabırla, kısa ve öz ama bilgilendirici yanıt ver

Kesin kurallar:
1. Olgusal iddialar (malzeme, süre, teknik, tescil, menşe) için YALNIZCA CONTEXT içindeki veriyi kullan. CONTEXT'te yoksa: "Paylaşılan bilgilerde bu konu yer almıyor." gibi kısa bir ifadeyle sınırlı kal; tahmin veya genel web bilgisi uydurma.
2. Konu dışı sorularda (başka şehir, alışveriş adresi, siyaset, tıbbi teşhis vb.) nazikçe bu sohbetin kapsamı dışında olduğunu belirt.
3. Yanıtlarda **kalın**, _italik_ ve madde işaretleri kullanabilirsin (arayüz bunları gösterir).
4. Yanıtta kaynak, CONTEXT, adım numarası, veri seti veya parantez içi atıf gösterme; doğal anlatıcı diliyle konuş.
5. Referans video sessizdir; anlatım yoktur. Adımlar Kadayıfçı Harun Usta atölye görüntülerine dayanır.

Video kontrolü:
- Kullanıcı videoyu oynatma, durdurma, ileri/geri sarma veya belirli adıma/saniyeye gitme istediğinde yanıtının EN SON satırına tek bir gizli komut ekle (kullanıcıya açıklama):
  [[VIDEO:{"action":"..."}]]
- Geçerli action değerleri:
  - "play" — oynat / devam et
  - "pause" — durdur
  - "seek" — {"action":"seek","seconds":34,"play":false} (saniye; play isteğe bağlı)
  - "step" — {"action":"step","step":4,"play":true} (adım 1–7; play isteğe bağlı)
  - "delta" — {"action":"delta","seconds":10} veya negatif saniye (geri)
  - "next_step" — sonraki tarif adımına geç
  - "prev_step" — önceki tarif adımına geç
- Adım başlangıç saniyeleri CONTEXT steps[].videoTimestamp alanındadır.
- Video kontrolü istenmediyse [[VIDEO:...]] ekleme.
- Soru + video isteği birlikte olabilir; kısa yanıt ver ve uygun komutu ekle.`;

const geminiRecipeContextBlock = [
  "### CONTEXT (Tek yetkili veri seti — uydurma yok)",
  "Aşağıdaki JSON dışındaki iddialarda spekülasyon yapma; bilgi yoksa kısaca söyle.",
  "```json",
  JSON.stringify(recipeContext, null, 2),
  "```",
].join("\n");

function buildCurrentStepBlock(currentStep?: number): string {
  if (currentStep === undefined || currentStep === 0) {
    return [
      "### Şu anki durum",
      "Kullanıcı henüz tarife başlamadı (Adım 0). Genel tanıtım ve malzemeler hakkında yanıt ver; adım adım tarife geçmesi için yönlendir.",
    ].join("\n");
  }

  const step = RECIPE_STEPS.find((s) => s.id === currentStep);
  if (!step) return "";

  const lines = [
    "### Şu anki adım",
    `Kullanıcı şu an **Adım ${step.id} — ${step.title}** üzerinde.`,
    "Teknik yanıtları öncelikle bu adımla ilişkilendir; kullanıcı açıkça sormadıkça ileri adımlara geçme.",
    "",
    `**Açıklama:** ${step.description}`,
  ];

  if (step.detail) {
    lines.push(`**Detay:** ${step.detail}`);
  }

  if (step.ingredients?.length) {
    lines.push(`**Bu adımdaki malzemeler:** ${step.ingredients.join(", ")}`);
  }

  if (step.tips?.length) {
    lines.push("", "**İpuçları:**");
    for (const tip of step.tips) {
      lines.push(`- ${tip}`);
    }
  }

  return lines.join("\n");
}

function buildVideoStateBlock(videoState?: RecipeVideoStateInput): string {
  if (!videoState) return "";

  const stepMarkers = RECIPE_STEPS.map(
    (s) => `Adım ${s.id} (${s.title}): ${s.videoTimestamp ?? 0}s`,
  ).join("\n");

  return [
    "### Video oynatıcı durumu",
    `- Aktif adım: ${videoState.currentStep}`,
    `- Konum: ${Math.round(videoState.currentTime)}s / ${Math.round(videoState.duration)}s`,
    `- Oynatılıyor: ${videoState.isPlaying ? "evet" : "hayır"}`,
    `- Adım sonu bekleniyor: ${videoState.awaitingContinue ? "evet" : "hayır"}`,
    "",
    "Adım başlangıç saniyeleri:",
    stepMarkers,
  ].join("\n");
}

export function buildGeminiRecipeFullSystemInstruction(
  currentStep?: number,
  videoState?: RecipeVideoStateInput,
): string {
  const stepBlock = buildCurrentStepBlock(currentStep);
  const videoBlock = buildVideoStateBlock(videoState);
  const parts = [geminiRecipeNarratorInstruction, stepBlock, videoBlock, geminiRecipeContextBlock].filter(
    Boolean,
  );
  return parts.join("\n\n");
}
