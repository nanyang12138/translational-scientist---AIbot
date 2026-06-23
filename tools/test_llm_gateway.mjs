import { buildAzureOpenAIRequest, buildOpenAICompatibleRequest } from "./agent_bridge_server.mjs";

const TIMEOUT_MS = Number(process.env.LLM_TEST_TIMEOUT_MS || 45000);

async function main() {
  const provider = (process.env.LLM_PROVIDER || "gateway").toLowerCase();
  const request =
    provider === "azure"
      ? buildAzureOpenAIRequest({ oracle: "测试网关连通性", game: {} })
      : buildOpenAICompatibleRequest({ oracle: "测试网关连通性", game: {}, provider });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const safeHeaders = redactHeaders(request.init.headers);

  try {
    const response = await fetch(request.url, {
      ...request.init,
      signal: controller.signal,
    });
    const text = await response.text();
    console.log(
      JSON.stringify(
        {
          ok: response.ok,
          provider,
          url: request.url,
          status: response.status,
          statusText: response.statusText,
          requestHeaders: safeHeaders,
          responsePreview: text.slice(0, 1200),
          diagnosis: diagnoseHttp(response.status),
        },
        null,
        2
      )
    );
    process.exitCode = response.ok ? 0 : 2;
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          provider,
          url: request.url,
          requestHeaders: safeHeaders,
          errorName: error.name,
          errorMessage: error.message,
          diagnosis: diagnoseNetworkError(error),
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

function redactHeaders(headers) {
  const sensitive = new Set(["authorization", "api-key", "ocp-apim-subscription-key"]);
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [
      key,
      sensitive.has(key.toLowerCase()) ? redact(String(value)) : String(value),
    ])
  );
}

function redact(value) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function diagnoseHttp(status) {
  if (status === 400) return "请求已到达服务,但 body/参数不兼容。检查 response_format、max_completion_tokens/max_tokens、model 名。";
  if (status === 401) return "请求已到达服务,但认证失败。检查 API key、Authorization/api-key header。";
  if (status === 403) return "请求已到达服务,但权限不足。检查 subscription key、user header、网关权限。";
  if (status === 404) return "请求已到达服务,但路径或 deployment 不存在。检查 base_url、LLM_CHAT_COMPLETIONS_PATH、Azure deployment。";
  if (status === 429) return "请求已到达服务,但限流或配额不足。";
  if (status >= 500) return "请求已到达服务,服务端错误或网关后端异常。";
  return "HTTP 层已连通。";
}

function diagnoseNetworkError(error) {
  const message = String(error?.message ?? "");
  const cause = String(error?.cause?.message ?? error?.cause ?? "");
  const combined = `${message} ${cause}`;
  if (/ENOTFOUND|getaddrinfo|No address associated/i.test(combined)) {
    return "DNS 解析失败。当前机器无法解析该 host,通常是内网/VPN/公司 DNS 或 base_url host 错误。";
  }
  if (/ECONNREFUSED/i.test(combined)) {
    return "连接被拒绝。host 可达但端口没有服务或被防火墙拒绝。";
  }
  if (/ETIMEDOUT|timeout|AbortError/i.test(combined)) {
    return "连接超时。可能需要 VPN/内网,或网关阻断当前网络。";
  }
  if (/certificate|TLS|SSL/i.test(combined)) {
    return "TLS/证书错误。检查企业证书、代理或 NODE_EXTRA_CA_CERTS。";
  }
  return "网络层失败。检查 VPN、DNS、代理、base_url。";
}

await main();
