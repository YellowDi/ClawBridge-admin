import COS from "cos-js-sdk-v5";

import { ApiError, getTencentCosSts } from "@/lib/api";

export type TencentCosUploadResult = {
  key: string;
  url: string;
};

const COS_OBJECT_PREFIX = "uploads/";
const DEFAULT_COS_STS_EXPIRES_SECONDS = 1800;
const DEFAULT_COS_SLICE_SIZE = 1024 * 1024;

export async function uploadKnowledgeFileToCos(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<TencentCosUploadResult> {
  const sts = await getTencentCosSts();

  if (!sts) {
    throw new ApiError("腾讯云 COS 鉴权信息获取失败。", 0, sts);
  }

  const bucket = normalizeText(sts.bucketName);
  const region = normalizeText(sts.region);
  const credentials = sts.sts;
  const secretId = normalizeText(credentials?.accessKeyId);
  const secretKey = normalizeText(credentials?.accessKeySecret);
  const securityToken = normalizeText(credentials?.securityToken);

  if (!bucket) {
    throw new ApiError("腾讯云 COS 鉴权响应缺少 bucketName。", 0, sts);
  }

  if (!region) {
    throw new ApiError("腾讯云 COS 鉴权响应缺少 region。", 0, sts);
  }

  if (!secretId || !secretKey || !securityToken) {
    throw new ApiError("腾讯云 COS 鉴权响应缺少临时凭证。", 0, sts);
  }

  const key = createObjectKey(file, getDomainObjectKeyPrefix(sts.domain));
  const { expiredTime, startTime } = parseCosStsTime(credentials?.expiration);
  const cos = new COS({
    getAuthorization(_, callback) {
      callback({
        ExpiredTime: expiredTime,
        SecurityToken: securityToken,
        StartTime: startTime,
        TmpSecretId: secretId,
        TmpSecretKey: secretKey,
      });
    },
  });
  const result = await cos.uploadFile({
    Body: file,
    Bucket: bucket,
    ContentType: file.type || undefined,
    Key: key,
    Region: region,
    SliceSize: DEFAULT_COS_SLICE_SIZE,
    onProgress(progress) {
      onProgress?.(Math.round(progress.percent * 100));
    },
  });

  return {
    key,
    url: buildObjectUrl(result.Location, key, {
      bucket,
      domain: sts.domain,
      endPoint: sts.endPoint,
      region,
    }),
  };
}

function createObjectKey(file: File, objectKeyPrefix: string) {
  const extension = getFileExtension(file.name);
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "");

  return `${objectKeyPrefix}${COS_OBJECT_PREFIX}${timestamp}-${random}${extension}`;
}

function getFileExtension(fileName: string) {
  const normalizedName = fileName.trim();
  const lastDotIndex = normalizedName.lastIndexOf(".");

  return lastDotIndex > -1
    ? normalizedName.slice(lastDotIndex).toLowerCase()
    : "";
}

function parseCosStsTime(expiration: unknown) {
  const normalizedExpiration = normalizeText(expiration);
  const parsedExpirationTime = Date.parse(normalizedExpiration);
  const numericExpirationTime = Number(normalizedExpiration);
  const now = Math.floor(Date.now() / 1000);
  const expiredTime =
    Number.isFinite(parsedExpirationTime) && parsedExpirationTime > 0
      ? Math.floor(parsedExpirationTime / 1000)
      : Number.isFinite(numericExpirationTime) && numericExpirationTime > 0
        ? Math.floor(
            numericExpirationTime > 10_000_000_000
              ? numericExpirationTime / 1000
              : numericExpirationTime,
          )
        : now + DEFAULT_COS_STS_EXPIRES_SECONDS;

  return {
    expiredTime,
    startTime: Math.max(0, now - 60),
  };
}

function buildObjectUrl(
  location: string | undefined,
  key: string,
  config: {
    bucket: string;
    domain?: string;
    endPoint?: string;
    region: string;
  },
) {
  const normalizedLocation = normalizeText(location);

  if (normalizedLocation) {
    return /^https?:\/\//i.test(normalizedLocation)
      ? normalizedLocation
      : `https://${normalizedLocation.replace(/^\/+/, "")}`;
  }

  const domain = normalizeText(config.domain) || normalizeText(config.endPoint);

  if (domain) {
    const normalizedDomain = /^https?:\/\//i.test(domain)
      ? domain
      : `https://${domain}`;
    const keyInDomain = removeObjectKeyPrefix(
      key,
      getDomainObjectKeyPrefix(normalizedDomain),
    );

    return `${normalizedDomain.replace(/\/+$/, "")}/${encodeObjectKey(keyInDomain)}`;
  }

  return `https://${config.bucket}.cos.${config.region}.myqcloud.com/${encodeObjectKey(key)}`;
}

function getDomainObjectKeyPrefix(domain: unknown) {
  const normalizedDomain = normalizeText(domain);

  if (!normalizedDomain) return "";

  try {
    const url = new URL(
      /^https?:\/\//i.test(normalizedDomain)
        ? normalizedDomain
        : `https://${normalizedDomain}`,
    );
    const pathname = url.pathname.replace(/^\/+|\/+$/g, "");

    return pathname ? `${pathname}/` : "";
  } catch {
    return "";
  }
}

function removeObjectKeyPrefix(key: string, prefix: string) {
  return prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
