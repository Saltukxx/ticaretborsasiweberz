import { Link } from "react-router-dom";
import SeoHead from "../components/SeoHead";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <>
      <SeoHead
        title="Sayfa bulunamadı"
        description="Aradığınız sayfa mevcut değil veya taşınmış olabilir."
        path="/404"
        noindex
      />
      <section className="not-found">
        <div className="container not-found__inner">
          <p className="mono not-found__code">404</p>
          <h1>Sayfa bulunamadı</h1>
          <p>Aradığınız adres mevcut değil, kaldırılmış veya geçici olarak kullanılamıyor olabilir.</p>
          <nav className="not-found__links">
            <Link className="btn btn-primary" to="/">
              Ana sayfa
            </Link>
            <Link className="btn btn-ghost" to="/fiyat-bulteni">
              Fiyat bülteni
            </Link>
            <Link className="btn btn-ghost" to="/iletisim">
              İletişim
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
