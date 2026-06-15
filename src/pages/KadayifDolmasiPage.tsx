import { Link } from "react-router-dom";
import { useRecipeChat } from "../hooks/useRecipeChat";
import { kadayifDolmasiRecipe } from "../data/kadayif-dolmasi-recipe";
import { formatVideoTime } from "../lib/recipeVideoSync";
import {
  RecipeVideoPlayer,
  RecipeChat,
} from "../components/kadayif-experience/RecipeExperience";
import RecipeContextPanel from "../components/kadayif-experience/RecipeContextPanel";
import PageHero from "../components/PageHero";
import "../components/kadayif-experience/KadayifExperience.css";

export default function KadayifDolmasiPage() {
  const {
    messages,
    currentStep,
    totalSteps,
    currentStepData,
    isTyping,
    videoRef,
    videoProgress,
    isVideoPlaying,
    awaitingContinue,
    sendMessage,
    goToStep,
    nextStep,
    prevStep,
    toggleVideoPlay,
    onVideoTimeUpdate,
    onVideoLoadedMetadata,
    onVideoEnded,
    onVideoPlay,
    onVideoPause,
    onProgressSeek,
  } = useRecipeChat();

  const recipe = kadayifDolmasiRecipe;

  return (
    <div className="kd-page">
      <PageHero
        breadcrumb="Coğrafi İşaretler · Kadayıf Dolması"
        eyebrow="İnteraktif Tarif Deneyimi"
        title={<>Kadayıf Dolması <em>Yapılış Rehberi</em></>}
        intro="Erzurum'un tescilli Kadayıf Dolması'nı Kadayıfçı Harun Usta atölye videosu eşliğinde adım adım izleyin; her adım sonunda video durur, devam etmek için siz karar verirsiniz."
      />

      <section className="kd-experience">
        <div className="container">
          <Link to="/cografi-isaretler" className="kd-back btn-link">
            ← Coğrafi İşaretler Atlası'na Dön
          </Link>

          <div className="kd-info-strip">
            <div className="kd-info-item">
              <span className="kd-info-label mono">Tescil</span>
              <span className="kd-info-value">{recipe.registration}</span>
            </div>
            <div className="kd-info-item">
              <span className="kd-info-label mono">Kategori</span>
              <span className="kd-info-value">{recipe.category}</span>
            </div>
            <div className="kd-info-item">
              <span className="kd-info-label mono">Menşe</span>
              <span className="kd-info-value">{recipe.origin}</span>
            </div>
            <div className="kd-info-item">
              <span className="kd-info-label mono">Adım</span>
              <span className="kd-info-value">
                {currentStep > 0
                  ? `${currentStep} / ${totalSteps}`
                  : `${totalSteps} adım`}
              </span>
            </div>
            {videoProgress.duration > 0 && (
              <div className="kd-info-item">
                <span className="kd-info-label mono">Video</span>
                <span className="kd-info-value mono">
                  {formatVideoTime(videoProgress.currentTime)} /{" "}
                  {formatVideoTime(videoProgress.duration)}
                </span>
              </div>
            )}
          </div>

          <div className="kd-layout">
            <RecipeVideoPlayer
              videoRef={videoRef}
              videoSrc={recipe.videoSrc}
              videoCredit={recipe.videoCredit}
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepTitle={currentStepData.title}
              steps={recipe.steps}
              videoProgress={videoProgress}
              isVideoPlaying={isVideoPlaying}
              onTogglePlay={toggleVideoPlay}
              onTimeUpdate={onVideoTimeUpdate}
              onLoadedMetadata={onVideoLoadedMetadata}
              onEnded={onVideoEnded}
              onPlay={onVideoPlay}
              onPause={onVideoPause}
              onProgressSeek={onProgressSeek}
            />

            <RecipeChat
              messages={messages}
              isTyping={isTyping}
              currentStep={currentStep}
              totalSteps={totalSteps}
              isVideoPlaying={isVideoPlaying}
              awaitingContinue={awaitingContinue}
              suggestions={
                currentStep > 0 ? currentStepData.suggestedQuestions : undefined
              }
              onSend={sendMessage}
              onNext={nextStep}
              onPrev={prevStep}
            />
          </div>

          <RecipeContextPanel
            recipe={recipe}
            currentStep={currentStep}
            currentStepData={currentStepData}
          />

          <div className="kd-timeline" role="group" aria-label="Tarif adımları">
            {recipe.steps.map((step) => (
              <button
                key={step.id}
                type="button"
                aria-pressed={currentStep === step.id}
                className={`kd-timeline__step ${
                  currentStep === step.id
                    ? "is-active"
                    : currentStep > step.id
                      ? "is-completed"
                      : ""
                }`}
                onClick={() =>
                  goToStep(step.id, { narrate: true, seekVideo: true, play: false })
                }
              >
                <span className="kd-timeline__num mono">
                  {currentStep > step.id ? "✓" : String(step.id).padStart(2, "0")}
                </span>
                <span className="kd-timeline__label">{step.title}</span>
                <span className="kd-timeline__time mono">
                  {formatVideoTime(step.videoTimestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
