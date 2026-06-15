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
  const targetUrl = new URL(
    path.join("/"),
    `${trimTrailingSlash(API_BASE_URL)}/`,
  );

  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");

  const response = await fetch(targetUrl, {
    body: canHaveBody(request.method) ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    headers,
    method: request.method,
    redirect: "manual",
  });

  return new Response(response.body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function canHaveBody(method: string) {
  return method !== "GET" && method !== "HEAD";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
