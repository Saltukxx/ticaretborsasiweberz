import PageHero from "../components/PageHero";
import "./ContactPage.css";

export default function ContactPage() {
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
          <form className="contact__form card" onSubmit={(e) => e.preventDefault()}>
            <h3>Mesaj Gönder</h3>
            <p>Kurumumuza iletmek istediğiniz konuyu paylaşın, ekibimiz en kısa sürede dönüş yapsın.</p>
            <div className="contact__row">
              <label>
                <span className="mono">Ad Soyad</span>
                <input type="text" placeholder="Ad Soyad" />
              </label>
              <label>
                <span className="mono">Kurum</span>
                <input type="text" placeholder="Kurum / Üye Adı" />
              </label>
            </div>
            <div className="contact__row">
              <label>
                <span className="mono">E-posta</span>
                <input type="email" placeholder="ornek@etb.org.tr" />
              </label>
              <label>
                <span className="mono">Telefon</span>
                <input type="tel" placeholder="+90 ___ ___ __ __" />
              </label>
            </div>
            <label>
              <span className="mono">Konu</span>
              <input type="text" placeholder="Talep konusu" />
            </label>
            <label>
              <span className="mono">Mesaj</span>
              <textarea rows={5} placeholder="Mesajınız..." />
            </label>
            <button className="btn btn-primary" type="submit">Mesajı Gönder</button>
          </form>

          <aside className="contact__side">
            <div className="card contact__card">
              <span className="mono contact__label">Adres</span>
              <p>Muratpaşa Mah. Cemal Gürsel Cad. No: 13<br />Yakutiye / Erzurum</p>
            </div>
            <div className="card contact__card">
              <span className="mono contact__label">Telefon · Faks</span>
              <p>+90 442 234 56 78<br />+90 442 234 56 79</p>
            </div>
            <div className="card contact__card">
              <span className="mono contact__label">E-posta</span>
              <p>bilgi@etb.org.tr<br />uye@etb.org.tr</p>
            </div>
            <div className="card contact__card">
              <span className="mono contact__label">Çalışma Saatleri</span>
              <p>Pazartesi — Cuma<br />08:30 — 17:30</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
