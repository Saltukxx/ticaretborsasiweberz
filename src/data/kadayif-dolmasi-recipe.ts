/**
 * Kadayıf Dolması — Tarif verisi (Kadayıfçı Harun Usta atölye videosuna göre).
 * Video: sessiz, ~60 sn; ETB sitesinde self-hosted.
 */

export interface RecipeStep {
  id: number;
  title: string;
  description: string;
  detail: string;
  ingredients?: string[];
  tips?: string[];
  /** Adıma özel sohbet öneri çipleri (UI; LLM bağlamına gönderilmez) */
  suggestedQuestions?: string[];
  /** Saniye — self-hosted videoda seek hedefi */
  videoTimestamp: number;
}

export interface Recipe {
  name: string;
  origin: string;
  category: string;
  registration: string;
  /** Self-hosted MP4 yolu (site kökünden) */
  videoSrc: string;
  videoCredit: string;
  heroImage: string;
  culturalContext: string;
  ingredients: { name: string; amount: string }[];
  steps: RecipeStep[];
  funFacts: string[];
}

export const kadayifDolmasiRecipe: Recipe = {
  name: "Kadayıf Dolması",
  origin: "Erzurum",
  category: "Tatlılar",
  registration: "26.06.2012 · Tescil No: 161",
  videoSrc: "/videos/kadayif-dolmasi-usta.mp4",
  videoCredit: "Kadayıfçı Harun Usta · Erzurum",
  heroImage:
    "https://beta.kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502103415957_ERZURUM%20KADYIF%20DOLMASI%20Fotograf%20Murat%20OCAL%200543.JPG?format=jpg&quality=70",
  culturalContext:
    "Bu rehber, Erzurum'un coğrafi işaretli tatlısı Kadayıf Dolması'nın **Kadayıfçı Harun Usta** atölyesindeki usta eli uygulamasını yansıtır. Videoda şerbet hazırlığı gösterilmez; şerbet önceden hazır bulunur. Dolmalar tel kadayıf ve cevizle sarılır, yumurtaya bulanır, kızartma yağında pişirilir ve şerbete alınır. 2012 yılında coğrafi işaret tescili almıştır.",

  ingredients: [
    { name: "Tel kadayıf", amount: "Usta ölçüsünde" },
    { name: "Ceviz içi (kırılmış)", amount: "Dolma başına bir tutam" },
    { name: "Yumurta", amount: "Dolmaları bulamak için yeterli miktarda" },
    { name: "Kızartma yağı", amount: "Derin tencereyi dolduracak kadar" },
    { name: "Şerbet (hazır)", amount: "Dolmaları batırmaya yetecek miktarda" },
  ],

  steps: [
    {
      id: 1,
      title: "Kadayıfı Sarma",
      description:
        "Tel kadayıf telleri tezgâhta açın. Avuç içinde küçük bir yığın kadayıf alın, ortasına ceviz koyun ve silindir (parmak) formunda sıkıca sarın. Uçları kapatın.",
      detail:
        "Videoda ustalar siyah eldivenle çalışır; dolmalar eşit boyutta ve sıra halinde dizilir. Kadayıfçı Harun Usta'nın atölyesinde sarma, üretimin temel adımıdır — her dolma aynı formda olmalıdır.",
      ingredients: ["Tel kadayıf", "Ceviz içi"],
      tips: [
        "Kadayıfı çok sıkıştırmadan, telleri koparmadan sarın.",
        "Ceviz ortada dengeli dağılmalı; uçlar kapanmalı.",
        "Hazır dolmalar tezgâhta sıra halinde bekletilir.",
      ],
      suggestedQuestions: [
        "Dolma ne kadar sıkı sarılmalı?",
        "Ceviz ne kadar konmalı?",
        "Eldiven şart mı?",
      ],
      videoTimestamp: 0,
    },
    {
      id: 2,
      title: "Yumurta Hazırlığı",
      description:
        "Geniş bir kaba yumurtaları kırın. Çırpıcı veya tel çırpıcı ile homojen, köpüklü bir yumurta karışımı elde edene kadar çırpın.",
      detail:
        "Videoda endüstriyel mutfakta gömme çelik kase kullanılır; evde geniş bir kap yeterlidir. Yumurta bulaması, kızartma sonrası dış yüzeyin altın rengi ve çıtırlık kazanmasını sağlar.",
      ingredients: ["Yumurta"],
      tips: [
        "Yumurtalar iyice çırpılmalı; ak ve sarı birbirine karışmalı.",
        "Bulama hemen öncesi hazırlanması uygundur.",
      ],
      suggestedQuestions: [
        "Kaç yumurta kullanılır?",
        "Sadece sarı mı, tüm yumurta mı?",
        "Tereyağı yerine yumurta mı?",
      ],
      videoTimestamp: 15,
    },
    {
      id: 3,
      title: "Yumurtaya Bulama",
      description:
        "Her sarılmış dolmayı yumurta karışımına daldırın; dış yüzeyin tamamı kaplanana kadar çevirin. Yağa atmadan önce fazla yumurtayı hafifçe süzdürün.",
      detail:
        "Videoda dolmalar tek tek veya birkaçlı gruplar halinde kaba daldırılır; mavi kasada bekleyen sarılmış dolmalar sırayla işlenir.",
      ingredients: ["Yumurta", "Sarılmış kadayıf dolmalar"],
      tips: [
        "Her yüzey yumurtayla kaplanmalı; eksik bırakılan yer çiğ kalabilir.",
        "Bulama sonrası hemen kızartmaya geçin.",
      ],
      suggestedQuestions: [
        "Hepsini aynı anda mi bulayım?",
        "Yumurta fazla damlarsa ne olur?",
        "Margarin kullanılır mı?",
      ],
      videoTimestamp: 24,
    },
    {
      id: 4,
      title: "Kızartma",
      description:
        "Kızartma yağı iyice ısıtın. Yumurtaya bulanmış dolmaları yağa bırakın; altın sarısı ve çıtır olana kadar kızartın. Kevgirle ara ara çevirin.",
      detail:
        "Videoda büyük çelik tencerede derin yağda kızartma yapılır. Dolmalar yağda yüzer; renk koyu altın kahverengiye dönene kadar pişirilir.",
      ingredients: ["Kızartma yağı"],
      tips: [
        "Yağ yeterince sıcak olmalı; soğuk yağ yağ emmesine yol açar.",
        "Tencereyi aşırı doldurmayın; dolmalar serbestçe dönsün.",
        "Kevgirle nazikçe çevirin; form bozulmasın.",
      ],
      suggestedQuestions: [
        "Hangi derecede kızarmalı?",
        "Tereyağı kullanılır mı?",
        "Ne kadar süre kızartılır?",
      ],
      videoTimestamp: 34,
    },
    {
      id: 5,
      title: "Şerbete Alma",
      description:
        "Kızarmış dolmaları kevgirle yağdan alın ve hazır şerbete aktarın. Sıcak dolmalar şerbet kasesine düşer düşmez emmeye başlar.",
      detail:
        "Videoda kızartma tenceresinin hemen yanında büyük şerbet tenceresi vardır. Kızarmış dolmalar doğrudan şerbete transfer edilir — bu, Erzurum usta uygulamasının kritik anıdır.",
      ingredients: ["Şerbet (hazır)", "Kızarmış dolmalar"],
      tips: [
        "Kızartmadan hemen sonra şerbete alın.",
        "Kevgirle yağ süzülerek aktarın.",
      ],
      suggestedQuestions: [
        "Şerbet sıcak mı soğuk mu?",
        "Yağdan şerbete nasıl geçilir?",
        "Şerbet nasıl hazırlanır?",
      ],
      videoTimestamp: 44,
    },
    {
      id: 6,
      title: "Şerbetleme",
      description:
        "Dolmalar şerbetin içinde bekletilir; kevgirle hafifçe karıştırarak her parçanın şerbet emmesini sağlayın.",
      detail:
        "Videoda dolmalar şeffaf amber renkli şerbette yüzer; üzerleri parlak ve iştah açıcı bir görünüm alır.",
      ingredients: ["Şerbet"],
      tips: [
        "Dolmalar tamamen şerbetle temas etmeli.",
        "Acele etmeden emmesini bekleyin.",
      ],
      suggestedQuestions: [
        "Ne kadar bekletmeliyim?",
        "Şerbeti çekmezse ne yapmalıyım?",
        "Karıştırmak gerekir mi?",
      ],
      videoTimestamp: 50,
    },
    {
      id: 7,
      title: "Servis",
      description:
        "Şerbetini çeken dolmaları süzgeçle alın. Tabakta porsiyonlayın; isteğe göre küçük parçalara bölerek servis edin.",
      detail:
        "Videoda maşayla tabağa alınır, bıçakla ikili parçalara kesilir. Tepside sıra halinde dizilmiş parlak kahverengi dolmalar vitrin sunumuna hazırdır.",
      tips: [
        "Servis öncesi fazla şerbeti süzdürün.",
        "Taze tüketim en iyi sonucu verir.",
      ],
      suggestedQuestions: [
        "Nasıl kesilir?",
        "Yanında ne ikram edilir?",
        "Ne kadar saklanır?",
      ],
      videoTimestamp: 56,
    },
  ],

  funFacts: [
    "Kadayıf dolması 2012 yılında Erzurum menşeli coğrafi işaret olarak tescil edilmiştir.",
    "Videodaki uygulama Kadayıfçı Harun Usta atölyesinden alınmıştır.",
    "Usta uygulamasında dolmalar yumurtaya bulanır ve derin yağda kızartılır.",
    "Şerbet hazırlığı videoda gösterilmez; atölyede önceden hazır şerbet kullanılır.",
    "Erzurum'da düğün ve bayram sofralarının vazgeçilmez tatlılarından biridir.",
    "Tel kadayıf ince hamur tellerinden oluşur; sarma ustaca elle yapılır.",
  ],
};

const { heroImage: _omitHeroImageForGeminiTokens, videoCredit: _omitCredit, ...recipeWithoutUiOnly } =
  kadayifDolmasiRecipe;
void _omitHeroImageForGeminiTokens;
void _omitCredit;

const recipePayloadForGeminiContext = {
  ...recipeWithoutUiOnly,
  steps: recipeWithoutUiOnly.steps.map(
    ({ suggestedQuestions: _omitUiOnlyChips, ...step }) => {
      void _omitUiOnlyChips;
      return step;
    },
  ),
};

/** Yetkili veri — Gemini yalnızca buna dayanmalıdır. */
export const geminiRecipeContextBlock = [
  "### CONTEXT (Tek yetkili veri seti — uydurma yok)",
  "Aşağıdaki JSON dışındaki iddialarda spekülasyon yapma; bilgi yoksa kısaca söyle.",
  "Video sessizdir; adımlar Kadayıfçı Harun Usta atölye görüntülerine dayanır.",
  "```json",
  JSON.stringify(recipePayloadForGeminiContext, null, 2),
  "```",
].join("\n");

/** Persona + bağlam dışı sınırlar (CONTEXT ayrı eklenir). */
export const geminiRecipeNarratorInstruction = `Sen, Erzurum Ticaret Borsası'nın dijital platformunda görev yapan bir kültürel anlatıcısın. Yalnızca "Kadayıf Dolması" coğrafi işaretli ürünü, Erzurum mutfak kültürü ve bu ürünün tescili ile ilgili sorulara yanıt verirsin.

Kişiliğin:
- Resmi ama sıcak Türkçe; emoji kullanma
- Erzurum kültürel mirasına saygılı; halka yakın ama doğru dil
- Sorulara sabırla, kısa ve öz ama bilgilendirici yanıt ver

Kesin kurallar:
1. Olgusal iddialar (malzeme, süre, teknik, tescil, menşe) için YALNIZCA CONTEXT içindeki veriyi kullan. CONTEXT'te yoksa: "Paylaşılan bilgilerde bu konu yer almıyor." gibi kısa bir ifadeyle sınırlı kal; tahmin veya genel web bilgisi uydurma.
2. Konu dışı sorularda (başka şehir, alışveriş adresi, siyaset, tıbbi teşhis vb.) nazikçe bu sohbetin kapsamı dışında olduğunu belirt.
3. Yanıtlarda **kalın**, _italik_ ve madde işaretleri kullanabilirsin (arayüz bunları gösterir).`;

export function buildGeminiRecipeFullSystemInstruction(): string {
  return `${geminiRecipeNarratorInstruction}\n\n${geminiRecipeContextBlock}`;
}

export const chatbotSystemPrompt = buildGeminiRecipeFullSystemInstruction();
