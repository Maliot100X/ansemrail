"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

type JsonRpcMessage = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
};

type SigningWindowProps = {
  requestId: string;
  apiKey?: string;
  signingKey?: string;
  onComplete: (result: any) => void;
};

export default function PayBoxSigningWindow({ requestId, apiKey, signingKey, onComplete }: SigningWindowProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initializedRef = useRef(false);
  const sandboxReadyRef = useRef(false);
  const contextRef = useRef<any>(null);
  const resourceRef = useRef<any>(null);
  const signingKeyRef = useRef("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sandboxOrigin, setSandboxOrigin] = useState("");

  const authHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["X-Paybox-Key"] = apiKey;
    return headers;
  }, [apiKey]);

  const postToSandbox = useCallback((message: JsonRpcMessage) => {
    iframeRef.current?.contentWindow?.postMessage(message, sandboxOrigin);
  }, [sandboxOrigin]);

  const deliverResource = useCallback(() => {
    const resource = resourceRef.current;
    if (!sandboxReadyRef.current || !resource) return;
    postToSandbox({
      jsonrpc: "2.0",
      method: "ui/notifications/sandbox-resource-ready",
      params: {
        html: resource.text || "",
        csp: resource._meta?.ui?.csp,
        permissions: resource._meta?.ui?.permissions,
        signingKey: signingKeyRef.current,
      },
    });
  }, [postToSandbox]);

  const deliverCall = useCallback(() => {
    const context = contextRef.current;
    const resource = resourceRef.current;
    if (!initializedRef.current || !context || !resource) return;

    postToSandbox({
      jsonrpc: "2.0",
      method: "ui/notifications/tool-input",
      params: { arguments: context.arguments },
    });
    postToSandbox({
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: context._tool?.raw || context.raw,
    });
  }, [postToSandbox, sandboxOrigin]);

  useEffect(() => {
    setSandboxOrigin(process.env.NEXT_PUBLIC_PAYBOX_SANDBOX_ORIGIN || window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    async function load() {
      try {
        const headers = authHeaders();
        const requests = [
          fetch(`/api/paybox?action=signing-context&requestId=${encodeURIComponent(requestId)}`, { headers, cache: "no-store" }),
          fetch(`/api/paybox?action=ui-resource`, { headers, cache: "no-store" }),
        ];
        if (!signingKey) requests.push(fetch(`/api/paybox?action=signing-key`, { headers, cache: "no-store" }));
        const responses = await Promise.all(requests);
        const [contextRes, resourceRes] = responses;
        const contextData = await contextRes.json();
        const resourceData = await resourceRes.json();
        const savedKeyData = signingKey ? { signingKey } : await responses[2].json();
        if (!contextRes.ok) throw new Error(contextData.error || "Unable to reopen the PayBox signing window");
        if (!resourceRes.ok) throw new Error(resourceData.error || "Unable to load the PayBox signing UI");
        if (cancelled) return;
        contextRef.current = contextData;
        resourceRef.current = resourceData.resource;
        signingKeyRef.current = signingKey || savedKeyData.signingKey || "";
        setReady(true);
        deliverResource();
        deliverCall();
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
      initializedRef.current = false;
      sandboxReadyRef.current = false;
    };
  }, [authHeaders, deliverCall, deliverResource, requestId, signingKey]);

  useEffect(() => {
    async function respond(id: string | number | null | undefined, result: any) {
      postToSandbox({ jsonrpc: "2.0", id, result });
    }

    async function respondError(id: string | number | null | undefined, message: string) {
      postToSandbox({
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message },
      });
    }

    async function handleMessage(event: MessageEvent) {
      if (event.origin !== sandboxOrigin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const message = event.data as JsonRpcMessage;
      if (!message || message.jsonrpc !== "2.0") return;

      if (message.method === "ui/notifications/sandbox-proxy-ready") {
        sandboxReadyRef.current = true;
        deliverResource();
        return;
      }

      if (message.method === "ui/initialize") {
        initializedRef.current = true;
        respond(message.id, {
          protocolVersion: "2026-01-26",
          hostInfo: { name: "AnsemRail", version: "1.0.0" },
          hostCapabilities: {
            openLinks: {},
            serverTools: { listChanged: false },
            serverResources: { listChanged: false },
          },
          hostContext: {
            theme: "dark",
            platform: "web",
            displayMode: "inline",
            availableDisplayModes: ["inline"],
            containerDimensions: { maxHeight: 520 },
            styles: { variables: { "color-background": "#09090b" } },
          },
        });
        deliverCall();
        return;
      }

      if (message.method === "ping") {
        respond(message.id, {});
        return;
      }

      if (message.method === "tools/call") {
        try {
          const res = await fetch("/api/paybox", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              action: "mcpTool",
              toolName: message.params?.name,
              arguments: message.params?.arguments || {},
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "PayBox tool call failed");
          respond(message.id, data);
        } catch (err: any) {
          respondError(message.id, err.message);
        }
        return;
      }

      if (message.method === "resources/read") {
        try {
          const uri = message.params?.uri;
          if (uri !== "ui://paybox/app" || !resourceRef.current) throw new Error("Unknown resource");
          respond(message.id, { contents: [resourceRef.current] });
        } catch (err: any) {
          respondError(message.id, err.message);
        }
        return;
      }

      if (message.method === "ui/open-link") {
        const url = message.params?.url;
        try {
          const parsed = new URL(url);
          if (parsed.protocol === "https:" || parsed.protocol === "http:") {
            window.open(parsed.href, "_blank", "noopener,noreferrer");
          }
          respond(message.id, {});
        } catch {
          respondError(message.id, "Invalid link");
        }
        return;
      }

      if (message.method === "ui/message") {
        respond(message.id, {});
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [authHeaders, deliverCall, deliverResource, postToSandbox, sandboxOrigin, signingKey]);

  useEffect(() => {
    return () => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          jsonrpc: "2.0",
          method: "ui/notifications/paybox-clear-credentials",
          params: {},
        },
        sandboxOrigin
      );
    };
  }, [sandboxOrigin]);

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-900/60 bg-red-950/20 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-red-300">PayBox signing window failed</p>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      {!sandboxOrigin && null}
      {!ready && (
        <div className="flex items-center gap-2 p-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          Loading secure PayBox signing window…
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={sandboxOrigin ? `${sandboxOrigin}/paybox-sandbox.html?host=${encodeURIComponent(window.location.origin)}` : undefined}
        title="PayBox secure signing window"
        sandbox="allow-scripts allow-same-origin"
        className="h-[520px] w-full bg-transparent"
      />
      <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2">
        <p className="text-xs text-zinc-500">PayBox signs inside this isolated MCP Apps view.</p>
        <a
          href="https://app.paybox.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
        >
          PayBox account <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
