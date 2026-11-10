import type { Profile } from "../content/types";

/** Profile photo, or monogram on a lunar gradient when no photo is uploaded yet. */
export function Avatar({ profile, size = 48 }: { profile: Pick<Profile, "name" | "avatarUrl">; size?: number }) {
  if (profile.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatarUrl}
        alt={profile.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-1 ring-line-strong"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = profile.name
    .split(/(?=[A-Z])|\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-label={profile.name}
      role="img"
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-[#0a0f1c] ring-1 ring-line-strong"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "radial-gradient(circle at 35% 30%, #f3f5fa, #bccbeb 55%, #8ea7dc)",
      }}
    >
      {initials}
    </span>
  );
}
