import type React from "react";
import { safeHref } from "./safeHref";

export function renderSiteChatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((\/[^)]+)\))|(_(.+?)_)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[4] && match[5]) {
      parts.push(
        <a key={key++} href={safeHref(match[5])}>
          {match[4]}
        </a>,
      );
    } else if (match[7]) {
      parts.push(<em key={key++}>{match[7]}</em>);
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts;
}

export function SiteChatMessageContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="site-chat-msg">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        if (line.startsWith("- ")) {
          return (
            <div className="site-chat-msg__bullet" key={i}>
              <span aria-hidden>•</span>
              <span>{renderSiteChatInline(line.slice(2))}</span>
            </div>
          );
        }

        return (
          <p className="site-chat-msg__para" key={i}>
            {renderSiteChatInline(line)}
          </p>
        );
      })}
    </div>
  );
}
