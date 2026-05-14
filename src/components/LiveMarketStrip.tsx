import { currencies } from "../data/market";
import "./LiveMarketStrip.css";

export default function LiveMarketStrip() {
  const list = [...currencies, ...currencies];
  return (
    <div className="ticker" aria-label="Güncel Kurlar ve Piyasa Verileri">
      <div className="ticker__label mono">
        <span className="ticker__pulse" />
        Canlı Piyasa
      </div>
      <div className="ticker__viewport">
        <div className="ticker__track">
          {list.map((c, i) => (
            <div key={`${c.code}-${i}`} className="ticker__item">
              <span className="ticker__code mono">{c.code}</span>
              <span className="ticker__value mono tabular">{c.value}</span>
              <span
                className={`ticker__chg mono ${c.up ? "is-up" : "is-down"}`}
              >
                {c.up ? "▲" : "▼"} {c.change}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="ticker__time mono">
        Son güncelleme · {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
