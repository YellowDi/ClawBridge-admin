"use client";

import { useState } from "react";

const sizeClasses = {
  xs: {
    chip: "size-4 rounded-sm",
    image: "size-3",
    text: "text-[9px]",
  },
  sm: {
    chip: "size-7 rounded-lg",
    image: "size-4",
    text: "text-xs",
  },
  md: {
    chip: "size-9 rounded-lg",
    image: "size-5",
    text: "text-sm",
  },
  lg: {
    chip: "size-14 rounded-2xl",
    image: "size-8",
    text: "text-lg",
  },
};

const modelProviderLogos: Record<string, string> = {
  anthropic: "claude",
  claude: "claude",
  claudeapi: "claude",
  custom: "openai",
  dashscope: "qwen",
  deepseek: "deepseek",
  doubao: "doubao",
  gemini: "gemini",
  google: "gemini",
  kimi: "kimi",
  minimax: "minimax",
  mimo: "xiaomimimo",
  moonshot: "kimi",
  openai: "openai",
  openrouter: "openai",
  qianfan: "wenxin",
  qwen: "qwen",
  wenxin: "wenxin",
  xiaomimimo: "xiaomimimo",
  zhipu: "zhipu",
};

const darkInvertLogos = new Set([
  "custom",
  "kimi",
  "mimo",
  "moonshot",
  "openai",
  "xiaomimimo",
]);

export function ModelProviderLogo({
  label,
  logo,
  providerType,
  size = "sm",
}: {
  label?: string;
  logo?: string;
  providerType?: string;
  size?: keyof typeof sizeClasses;
}) {
  const normalizedProviderType = providerType?.trim() ?? "";
  const catalogLogo = logo?.trim() ?? "";
  const localLogo = modelProviderLogos[normalizedProviderType.toLowerCase()];
  const imageSrcs = uniqueValues([
    normalizeLogoSrc(catalogLogo),
    getLocalLogoSrc(localLogo),
  ]);
  const [failedSrcs, setFailedSrcs] = useState<string[]>([]);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const imageSrc = imageSrcs.find((src) => !failedSrcs.includes(src)) ?? "";
  const loaded = Boolean(imageSrc && loadedSrc === imageSrc);
  const invertKey =
    getLogoKey(imageSrc) || normalizedProviderType.toLowerCase();
  const fallback = (label || normalizedProviderType || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  const classes = sizeClasses[size];

  return (
    <span
      className={`bg-surface-secondary text-muted relative grid shrink-0 place-items-center overflow-hidden ${classes.chip}`}
    >
      {!loaded ? (
        <span className={`${classes.text} font-bold leading-none`}>
          {fallback}
        </span>
      ) : null}
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 m-auto object-contain ${classes.image} ${
            darkInvertLogos.has(invertKey)
              ? "dark:invert dark:brightness-110"
              : ""
          }`}
          src={imageSrc}
          onError={() =>
            setFailedSrcs((current) =>
              current.includes(imageSrc) ? current : [...current, imageSrc],
            )
          }
          onLoad={() => setLoadedSrc(imageSrc)}
        />
      ) : null}
    </span>
  );
}

function normalizeLogoSrc(value: string) {
  const logo = value.trim();

  if (!logo) return "";
  if (/^(https?:|data:image\/|\/)/i.test(logo)) return logo;
  if (logo.includes("/")) return `/${logo.replace(/^\/+/, "")}`;
  if (logo.includes(".")) return `/model-logos/${logo}`;

  return `/model-logos/${logo}.svg`;
}

function getLocalLogoSrc(logo?: string) {
  return logo ? `/model-logos/${logo}.svg` : "";
}

function uniqueValues(values: string[]) {
  return values.filter(
    (value, index) => value && values.indexOf(value) === index,
  );
}

function getLogoKey(value: string) {
  const logo = value.trim().toLowerCase();

  if (!logo) return "";

  const pathname = logo.split(/[?#]/, 1)[0] ?? "";
  const filename = pathname.split("/").pop() ?? pathname;

  return filename.replace(/\.[a-z0-9]+$/, "");
}
