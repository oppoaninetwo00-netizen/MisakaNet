// MisakaNet Register Proxy — Cloudflare Worker
// 部署方式: 见 workers/README.md
// 环境变量: REGISTER_TOKEN (GitHub PAT, 仅存服务端)

const REPO = "Ikalus1988/MisakaNet";
const GITHUB_API = "https://api.github.com";

// IP 限流: 每个 IP 每 30 秒最多 1 次
const RATE_LIMIT_WINDOW = 30_000;
const rateMap = new Map();

export default {
  async fetch(request) {
    // CORS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // IP 限流
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    const last = rateMap.get(ip) || 0;
    if (now - last < RATE_LIMIT_WINDOW) {
      const remaining = Math.ceil((RATE_LIMIT_WINDOW - (now - last)) / 1000);
      return new Response(
        JSON.stringify({ error: `Rate limited. Try again in ${remaining}s.` }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    }
    rateMap.set(ip, now);

    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // 校验必填字段
    if (!body.agent_type) {
      return new Response(JSON.stringify({ error: "Missing agent_type" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // 构造 Issue body
    const nameLine = body.node_name
      ? `\n注册名称: **${body.node_name}**`
      : "";
    const agentLine = `\nAgent 类型: **${body.agent_type.toUpperCase()}**`;
    const inviteLine = body.invite_code
      ? `\n邀请人: **@${body.invite_code}**`
      : "";
    const issueBody = `## 🧠 通过公开通道加入御坂网络${nameLine}${agentLine}${inviteLine}\n\n已确认条款。`;

    // 调用 GitHub API — token 只出现在这里
    const token = REGISTER_TOKEN; // 从 Cloudflare 环境变量读取
    if (!token) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const resp = await fetch(`${GITHUB_API}/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "MisakaNet-Worker",
      },
      body: JSON.stringify({
        title: "join",
        body: issueBody,
        labels: ["registration"],
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: data.message || "GitHub API error" }),
        { status: resp.status, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        issue_url: data.html_url,
        issue_number: data.number,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  },
};
