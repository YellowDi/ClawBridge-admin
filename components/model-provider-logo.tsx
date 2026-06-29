"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const sizeClasses = {
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
  providerType,
  size = "sm",
}: {
  label?: string;
  providerType?: string;
  size?: keyof typeof sizeClasses;
}) {
  const normalizedProviderType = providerType?.trim() ?? "";
  const logo = modelProviderLogos[normalizedProviderType.toLowerCase()];
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fallback = (label || normalizedProviderType || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  const classes = sizeClasses[size];

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [logo]);

  return (
    <span
      className={`bg-surface-secondary text-muted relative grid shrink-0 place-items-center overflow-hidden ${classes.chip}`}
    >
      {!loaded ? (
        <span className={`${classes.text} font-bold leading-none`}>
          {fallback}
        </span>
      ) : null}
      {logo && !failed ? (
        <Image
          unoptimized
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 m-auto object-contain ${classes.image} ${
            darkInvertLogos.has(normalizedProviderType.toLowerCase())
              ? "dark:invert dark:brightness-110"
              : ""
          }`}
          height={20}
          src={`/model-logos/${logo}.svg`}
          width={20}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </span>
  );
}
