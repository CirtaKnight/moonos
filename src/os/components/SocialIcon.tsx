import { AtSign, Briefcase, Globe } from "lucide-react";
import {
  siBehance,
  siCodeforces,
  siDevdotto,
  siDiscord,
  siDribbble,
  siFacebook,
  siGithub,
  siGitlab,
  siInstagram,
  siKaggle,
  siLeetcode,
  siMedium,
  siStackoverflow,
  siTiktok,
  siX,
  siYoutube,
  type SimpleIcon,
} from "simple-icons";

const BRANDS: Record<string, SimpleIcon> = {
  github: siGithub,
  gitlab: siGitlab,
  instagram: siInstagram,
  x: siX,
  twitter: siX,
  youtube: siYoutube,
  discord: siDiscord,
  behance: siBehance,
  dribbble: siDribbble,
  medium: siMedium,
  "dev.to": siDevdotto,
  dev: siDevdotto,
  leetcode: siLeetcode,
  codeforces: siCodeforces,
  kaggle: siKaggle,
  tiktok: siTiktok,
  facebook: siFacebook,
  "stack overflow": siStackoverflow,
  stackoverflow: siStackoverflow,
};

/** Brand mark for a social platform (by name), with sensible fallbacks. */
export function SocialIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  const key = platform.trim().toLowerCase();
  const brand = BRANDS[key];
  if (brand) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d={brand.path} />
      </svg>
    );
  }
  if (key.includes("linkedin")) return <Briefcase size={size} aria-hidden />;
  if (key.includes("mail")) return <AtSign size={size} aria-hidden />;
  return <Globe size={size} aria-hidden />;
}
