import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import { useSiteContact } from "../hooks/usePublicApi";
import { ApiError, submitContactForm } from "../lib/publicApi";
import "./ContactPage.css";

function formatMultiline(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text.split(/\n/).map((l) => l.trim()).filter(Boolean);
}

export default function ContactPage() {
  const { data: contact } = useSiteContact();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(searchParams.get("konu") ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addressLines = formatMultiline(contact?.address);
  const hoursLines = formatMultiline(contact?.hours);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await submitContactForm({
        fullName: fullName.trim(),
        organization: organization.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setFullName("");
      setOrganization("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        breadcrumb="İletişim"
        eyebrow="Bize Ulaşın · Kurumsal İletişim"
        title={<>İletişim <em>Merkezi</em></>}
        intro="Üyelik, tescil, laboratuvar ve kurumsal işlemler için iletişim kanallarımız."
      />
      <section className="contact">
        <div className="container contact__grid">
          <form className="contact__form card" onSubmit={onSubmit}>
            <h3>Mesaj Gönder</h3>
            <p>Kurumumuza iletmek istediğiniz konuyu paylaşın, ekibimiz en kısa sürede dönüş yapsın.</p>
            {success && (
              <p className="contact__feedback contact__feedback--ok" role="status">
                Mesajınız alındı. En kısa sürede size dönüş yapılacaktır.
              </p>
            )}
            {error && (
              <p className="contact__feedback contact__feedback--err" role="alert">
                {error}
              </p>
            )}
            <div className="contact__row">
              <label>
                <span className="mono">Ad Soyad</span>
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
              <label>
                <span className="mono">Kurum</span>
                <input
                  type="text"
                  placeholder="Kurum / Üye Adı"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </label>
            </div>
            <div className="contact__row">
              <label>
                <span className="mono">E-posta</span>
                <input
                  type="email"
                  placeholder="ornek@etb.org.tr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                <span className="mono">Telefon</span>
                <input
                  type="tel"
                  placeholder="+90 ___ ___ __ __"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>
            <label>
              <span className="mono">Konu</span>
              <input
                type="text"
                placeholder="Talep konusu"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label>
              <span className="mono">Mesaj</span>
              <textarea
                rows={5}
                placeholder="Mesajınız..."
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Gönderiliyor…" : "Mesajı Gönder"}
            </button>
          </form>

          <aside className="contact__side">
            <div className="card contact__card">
              <span className="mono contact__label">Adres</span>
              <p>
                {addressLines.length > 0
                  ? addressLines.map((line, i) => (
                      <span key={line}>
                        {line}
                        {i < addressLines.length - 1 && <br />}
                      </span>
                    ))
                  : "—"}
              </p>
            </div>
            <div className="card contact__card">
              <span className="mono contact__label">Telefon · Faks</span>
              <p>
                {contact?.phone ?? "—"}
                {contact?.fax && (
                  <>
                    <br />
                    {contact.fax}
                  </>
                )}
              </p>
            </div>
            <div className="card contact__card">
              <span className="mono contact__label">E-posta</span>
              <p>
                {contact?.emailPrimary && (
                  <a href={`mailto:${contact.emailPrimary}`}>{contact.emailPrimary}</a>
                )}
                {contact?.emailPrimary && contact?.emailSecondary && <br />}
                {contact?.emailSecondary && (
                  <a href={`mailto:${contact.emailSecondary}`}>{contact.emailSecondary}</a>
                )}
                {!contact?.emailPrimary && !contact?.emailSecondary && "—"}
              </p>
            </div>
            <div className="card contact__card">
              <span className="mono contact__label">Çalışma Saatleri</span>
              <p>
                {hoursLines.length > 0
                  ? hoursLines.map((line, i) => (
                      <span key={line}>
                        {line}
                        {i < hoursLines.length - 1 && <br />}
                      </span>
                    ))
                  : "—"}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
