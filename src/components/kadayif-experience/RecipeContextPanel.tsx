import { useState } from "react";
import type { Recipe, RecipeStep } from "../../data/kadayif-dolmasi-recipe";

interface RecipeContextPanelProps {
  recipe: Recipe;
  currentStep: number;
  currentStepData: RecipeStep;
}

function ingredientMatchesStep(ingredientName: string, stepIngredients: string[]): boolean {
  const normalized = ingredientName.toLocaleLowerCase("tr-TR");
  return stepIngredients.some((stepIng) => {
    const stepNorm = stepIng.toLocaleLowerCase("tr-TR");
    return normalized.includes(stepNorm) || stepNorm.includes(normalized.split(" ")[0] ?? "");
  });
}

export default function RecipeContextPanel({
  recipe,
  currentStep,
  currentStepData,
}: RecipeContextPanelProps) {
  const [cultureOpen, setCultureOpen] = useState(false);
  const featuredFact = recipe.funFacts[0] ?? "";
  const activeStepIngredients = currentStep > 0 ? (currentStepData.ingredients ?? []) : [];

  return (
    <aside className="kd-context" aria-label="Tarif özeti ve malzemeler">
      <div className="kd-context__card">
        <h2 className="kd-context__title">Malzemeler</h2>
        <ul className="kd-context__list">
          {recipe.ingredients.map((ing) => {
            const isActive =
              currentStep > 0 &&
              activeStepIngredients.length > 0 &&
              ingredientMatchesStep(ing.name, activeStepIngredients);

            return (
              <li
                key={ing.name}
                className={isActive ? "is-active-ingredient" : undefined}
              >
                <span>{ing.name}</span>
                <span className="mono kd-context__amount">{ing.amount}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="kd-context__card kd-context__card--culture">
        <h2 className="kd-context__title">Kültürel bağlam</h2>
        {currentStep > 0 && (
          <p className="kd-context__current-step mono">
            Şu an: Adım {currentStep} — {currentStepData.title}
          </p>
        )}
        <p className={`kd-context__culture ${cultureOpen ? "is-expanded" : ""}`}>
          {recipe.culturalContext}
        </p>
        <button
          type="button"
          className="kd-context__toggle btn-link"
          onClick={() => setCultureOpen((v) => !v)}
          aria-expanded={cultureOpen}
        >
          {cultureOpen ? "Daha az göster" : "Devamını oku"}
        </button>
        {featuredFact && (
          <p className="kd-context__fact mono">
            <span className="kd-context__fact-label">Biliyor muydunuz?</span>
            {featuredFact}
          </p>
        )}
      </div>
    </aside>
  );
}
