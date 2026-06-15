import { Link } from "react-router-dom";

type Props = {
  className?: string;
};

export function ChatKvkkNotice({ className = "" }: Props) {
  return (
    <p className={`chat-kvkk-notice ${className}`.trim()}>
      Sohbet kayıtları KVKK kapsamında saklanır.{" "}
      <Link to="/kvkk/aydinlatma-internet">Aydınlatma metni</Link>
    </p>
  );
}
