export type NarratorAvatarState = "idle" | "speaking" | "listening";
export type NarratorAvatarVariant = "header" | "bubble";

interface NarratorAvatarProps {
  variant?: NarratorAvatarVariant;
  state?: NarratorAvatarState;
  className?: string;
}

export default function NarratorAvatar({
  variant = "header",
  state = "idle",
  className = "",
}: NarratorAvatarProps) {
  return (
    <div
      className={`kd-narrator kd-narrator--${variant} kd-narrator--${state} ${className}`.trim()}
      aria-hidden
    >
      <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Şef şapkası */}
        <path
          className="kd-narrator__hat"
          d="M8 18c0-6 6.5-10 16-10s16 4 16 10v3H8v-3z"
          fill="currentColor"
        />
        <rect
          className="kd-narrator__hat-band"
          x="6"
          y="20"
          width="36"
          height="4"
          rx="1"
          fill="currentColor"
          opacity="0.85"
        />
        {/* Baş */}
        <circle className="kd-narrator__head" cx="24" cy="28" r="10" fill="currentColor" />
        {/* Önlük / gövde silueti */}
        <path
          className="kd-narrator__body"
          d="M12 38c2-2 6-3 12-3s10 1 12 3v14H12V38z"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Önlük bağcığı */}
        <path
          d="M24 35v8M18 40h12"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Gözler */}
        <circle cx="20" cy="27" r="1.2" fill="#fff" opacity="0.9" />
        <circle cx="28" cy="27" r="1.2" fill="#fff" opacity="0.9" />
        {/* Ağız — konuşma animasyonu */}
        <path
          className="kd-narrator__mouth"
          d="M20 32 Q24 34 28 32"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
