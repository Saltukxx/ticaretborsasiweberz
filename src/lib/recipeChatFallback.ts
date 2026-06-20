import {
  kadayifDolmasiRecipe,
  type RecipeStep,
} from "../data/kadayif-dolmasi-recipe";

export const RECIPE_CHAT_CONTEXT_MISSING =
  "Paylaşılan bilgilerde bu konu yer almıyor. Malzemeler, tarif adımları veya kültürel bağlam hakkında soru sorabilirsiniz.";

const recipe = kadayifDolmasiRecipe;

export function narrateStepForFallback(step: RecipeStep): string {
  let text = `**Adım ${step.id}/${recipe.steps.length} — ${step.title}**\n\n`;
  text += step.description + "\n\n";
  text += `_${step.detail}_`;

  if (step.tips && step.tips.length > 0) {
    text += "\n\n**İpuçları:**\n";
    step.tips.forEach((tip) => {
      text += `• ${tip}\n`;
    });
  }

  return text;
}

export function answerRecipeQuestion(
  text: string,
  currentStep: number,
): string | null {
  const lower = text.toLocaleLowerCase("tr-TR");

  if (
    lower.includes("malzeme") ||
    lower.includes("ne lazım") ||
    lower.includes("neler gerek")
  ) {
    let ans = "**Kadayıf Dolması için gereken malzemeler:**\n\n";
    recipe.ingredients.forEach((ing) => {
      ans += `• ${ing.name} — ${ing.amount}\n`;
    });
    return ans;
  }

  if (
    lower.includes("kalori") ||
    lower.includes("sağlık") ||
    lower.includes("diyet")
  ) {
    return RECIPE_CHAT_CONTEXT_MISSING;
  }

  if (
    lower.includes("tarih") ||
    lower.includes("kültür") ||
    lower.includes("gelenek") ||
    lower.includes("osmanlı") ||
    lower.includes("nereden") ||
    lower.includes("hikaye") ||
    lower.includes("köken")
  ) {
    return recipe.culturalContext;
  }

  if (lower.includes("tereyağ") || lower.includes("margarin")) {
    return RECIPE_CHAT_CONTEXT_MISSING;
  }

  if (lower.includes("yağ") || lower.includes("kızart")) {
    const step = recipe.steps.find((s) => s.id === 4);
    if (!step) return RECIPE_CHAT_CONTEXT_MISSING;
    return `**${step.title}**\n\n${step.description}\n\n_${step.detail}_`;
  }

  if (lower.includes("yumurta") || lower.includes("bulama")) {
    const prep = recipe.steps.find((s) => s.id === 2);
    const dip = recipe.steps.find((s) => s.id === 3);
    let ans = "";
    if (prep) ans += `**${prep.title}:** ${prep.description}\n\n`;
    if (dip) ans += `**${dip.title}:** ${dip.description}`;
    return ans || RECIPE_CHAT_CONTEXT_MISSING;
  }

  if (
    lower.includes("şerbet") &&
    (lower.includes("hazır") ||
      lower.includes("kaynat") ||
      lower.includes("nasıl yap") ||
      lower.includes("tarif"))
  ) {
    return "Videoda şerbet hazırlığı gösterilmez; atölyede **hazır şerbet** kullanılır. Şerbete alma ve şerbetleme adımları rehberde anlatılır.";
  }

  if (
    lower.includes("ceviz") ||
    lower.includes("fındık") ||
    lower.includes("iç")
  ) {
    const step = recipe.steps.find((s) => s.id === 3);
    if (!step) return RECIPE_CHAT_CONTEXT_MISSING;
    let ans = `**${step.title}**\n\n${step.description}\n\n_${step.detail}_`;
    if (step.tips?.length) {
      ans += "\n\n**İpuçları:**\n";
      step.tips.forEach((tip) => {
        ans += `• ${tip}\n`;
      });
    }
    return ans;
  }

  if (
    lower.includes("şerbet") ||
    lower.includes("şeker") ||
    lower.includes("tatlandır")
  ) {
    const pourStep = recipe.steps.find((s) => s.id === 5);
    const soakStep = recipe.steps.find((s) => s.id === 6);
    let ans = "";
    if (pourStep) {
      ans += `**${pourStep.title}:** ${pourStep.description}\n\n_${pourStep.detail}_`;
    }
    if (soakStep) {
      ans += `\n\n**${soakStep.title}:** ${soakStep.description}`;
    }
    return ans || RECIPE_CHAT_CONTEXT_MISSING;
  }

  if (
    lower.includes("sakla") ||
    lower.includes("buzd") ||
    lower.includes("dayanık") ||
    lower.includes("ne kadar dayanır")
  ) {
    const serveStep = recipe.steps.find((s) => s.id === 7);
    if (serveStep?.tips?.length) {
      let ans = `**${serveStep.title} — saklama ve servis:**\n\n`;
      serveStep.tips.forEach((tip) => {
        ans += `• ${tip}\n`;
      });
      return ans;
    }
    return RECIPE_CHAT_CONTEXT_MISSING;
  }

  if (lower.includes("ipucu") || lower.includes("püf") || lower.includes("dikkat")) {
    const step = recipe.steps[currentStep - 1];
    if (step?.tips && step.tips.length > 0) {
      let ans = `**${step.title} için ipuçları:**\n\n`;
      step.tips.forEach((tip) => {
        ans += `• ${tip}\n`;
      });
      return ans;
    }
    return "Bu adımla ilgili ek bir ipucu bulunmuyor, ancak başka bir sorunuz varsa yardımcı olmaktan memnuniyet duyarım.";
  }

  if (
    lower.includes("ilginç") ||
    lower.includes("bilgi") ||
    lower.includes("biliyor") ||
    lower.includes("enteresan")
  ) {
    const fact =
      recipe.funFacts[Math.floor(Math.random() * recipe.funFacts.length)];
    return `**İlginç Bilgi:** ${fact}`;
  }

  if (
    lower.includes("coğrafi") ||
    lower.includes("tescil") ||
    lower.includes("patent")
  ) {
    return `Kadayıf Dolması, **${recipe.registration}** tarih ve numarasıyla coğrafi işaret olarak tescil edilmiştir.\n\n${recipe.culturalContext}`;
  }

  if (
    lower.includes("teşekkür") ||
    lower.includes("sağol") ||
    lower.includes("eyvallah")
  ) {
    return "Rica ederim! Erzurum'un bu güzel kültürel mirasını sizinle paylaşmak bir ayrıcalık. Başka bir sorunuz olursa çekinmeden sorabilirsiniz. Afiyet olsun!";
  }

  if (
    lower.includes("merhaba") ||
    lower.includes("selam") ||
    lower.includes("hey")
  ) {
    return "Hoş geldiniz! Kadayıf dolmasının yapılışını birlikte keşfetmeye hazır mısınız? \"Tarife Başla\" butonuna tıklayarak ya da soru sorarak devam edebilirsiniz.";
  }

  if (
    lower.includes("bu adım") ||
    lower.includes("şimdi ne") ||
    lower.includes("ne yapmalı")
  ) {
    const step = recipe.steps[currentStep - 1];
    if (step) return narrateStepForFallback(step);
    return "Henüz tarife başlamadınız. \"Tarife Başla\" butonuna tıklayarak ilk adıma geçebilirsiniz.";
  }

  return null;
}

export function recipeChatFallbackAnswer(): string {
  const responses = [
    "Bu konuda elimdeki bilgi sınırlı, ancak kadayıf dolmasının yapılışıyla ilgili herhangi bir sorunuz varsa detaylı cevap verebilirim. Malzemeler, teknikler veya kültürel bağlam hakkında sormak ister misiniz?",
    "Bu soruyu tam olarak cevaplayamıyorum. Kadayıf dolmasının tarifi, malzemeleri, kültürel hikayesi veya yapım teknikleri hakkında sorularınızı yanıtlayabilirim.",
    "Kadayıf dolması dışındaki konularda bilgim sınırlıdır. Tariflerin adımları, Erzurum mutfak kültürü veya malzemeler hakkında soru sormayı deneyin.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
