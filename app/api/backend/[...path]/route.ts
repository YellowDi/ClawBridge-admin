import type { NextRequest } from "next/server";

import { API_BASE_URL } from "@/lib/api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const pathValue = path.join("/");
  const targetUrl = new URL(pathValue, `${trimTrailingSlash(API_BASE_URL)}/`);

  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");

  const timeoutController = isPluginInstallPath(pathValue)
    ? new AbortController()
    : undefined;
  const timeoutId = timeoutController
    ? setTimeout(() => timeoutController.abort(), 650_000)
    : undefined;

  try {
    const response = await fetch(targetUrl, {
      body: canHaveBody(request.method)
        ? await request.arrayBuffer()
        : undefined,
      cache: "no-store",
      headers,
      method: request.method,
      redirect: "manual",
      signal: timeoutController?.signal,
    });

    return new Response(response.body, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function canHaveBody(method: string) {
  return method !== "GET" && method !== "HEAD";
}

function isPluginInstallPath(path: string) {
  return path === "openclaw/plugins/instances/install";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
