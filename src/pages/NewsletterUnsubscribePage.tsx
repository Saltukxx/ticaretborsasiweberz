/**
 * E-bülten abonelikten çıkma sayfası.
 * E-postadaki bağlantı buraya ?email=...&token=... ile gelir;
 * kullanıcı onayladığında HMAC token ile doğrulanan istek atılır.
 */
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, unsubscribeNewsletter } from "../lib/publicApi";
import "./NewsletterUnsubscribePage.css";

type Phase = "confirm" | "working" | "done" | "error";

export default function NewsletterUnsubscribePage() {
  const [params] = useSearchParams();
  const email = (params.get("email") ?? "").trim().toLowerCase();
  const token = (params.get("token") ?? "").trim();
  const [phase, setPhase] = useState<Phase>("confirm");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const linkValid = useMemo(
    () => /\S+@\S+\.\S+/.test(email) && /^[0-9a-f]{64}$/i.test(token),
    [email, token],
  );

  async function onConfirm() {
    setPhase("working");
    setErrorMsg(null);
    try {
      await unsubscribeNewsletter({ email, token });
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setErrorMsg(
        err instanceof ApiError && err.code === "INVALID_TOKEN"
          ? "Bağlantı geçersiz görünüyor. Lütfen e-postanızdaki bağlantıyı eksiksiz kopyaladığınızdan emin olun."
          : "İşlem sırasında bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
      );
    }
  }

  return (
    <div className="unsub-page">
      <div className="unsub-card">
        <span className="unsub-card__eyebrow mono">e-Bülten</span>

        {!linkValid ? (
          <>
            <h1>Bağlantı eksik veya hatalı</h1>
            <p>
              Abonelikten çıkma bağlantısı geçersiz görünüyor. Lütfen
              e-postanızdaki bağlantıyı eksiksiz açtığınızdan emin olun ya da
              bizimle <Link to="/iletisim">iletişime geçin</Link>.
            </p>
          </>
        ) : phase === "done" ? (
          <>
            <h1>Aboneliğiniz sonlandırıldı</h1>
            <p>
              <strong>{email}</strong> adresi e-bülten listemizden çıkarıldı.
              Artık bizden bülten almayacaksınız.
            </p>
            <p className="unsub-card__note">
              Fikriniz değişirse footer'daki formdan yeniden abone
              olabilirsiniz.
            </p>
            <Link to="/" className="btn btn-primary">
              Anasayfaya dön
            </Link>
          </>
        ) : (
          <>
            <h1>Abonelikten çıkmak istiyor musunuz?</h1>
            <p>
              <strong>{email}</strong> adresine gönderilen e-bültenleri
              durdurmak üzeresiniz.
            </p>
            {phase === "error" && errorMsg && (
              <p className="unsub-card__error" role="alert">
                {errorMsg}
              </p>
            )}
            <div className="unsub-card__actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onConfirm}
                disabled={phase === "working"}
              >
                {phase === "working" ? "İşleniyor…" : "Evet, abonelikten çık"}
              </button>
              <Link to="/" className="btn btn-ghost">
                Vazgeç
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
