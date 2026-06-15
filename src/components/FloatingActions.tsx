import WhatsAppFloat from "./WhatsAppFloat";
import SiteChatWidget from "./SiteChatWidget";
import "./FloatingActions.css";

export default function FloatingActions() {
  return (
    <div className="fab-stack" aria-label="Hızlı iletişim">
      <SiteChatWidget />
      <WhatsAppFloat />
    </div>
  );
}
