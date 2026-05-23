# MisakaNet Register Proxy (Cloudflare Worker)

## 部署步骤

1. 打开 https://dash.cloudflare.com/ → Workers & Pages
2. 点 "Create Worker"
3. 粘贴 `register-proxy.js` 的内容
4. 在 Worker 设置页面添加环境变量:
   - 变量名: `REGISTER_TOKEN`
   - 值: 你的 GitHub PAT（scoped to issues:write on this repo only）
5. 点 "Save and Deploy"
6. 记下 Worker 的 URL（例如 `https://misakanet-register.xxx.workers.dev`）

## 配置前端

1. 在 `docs/index.html` 中找到 `registerNode()` 函数
2. 将 fetch URL 从 `https://api.github.com/repos/.../issues` 改为 Worker URL
3. 移除所有 hex PAT 相关代码（`REGISTER_TOKEN` 变量、`TOKEN_HEX`、curl 命令中的 token）

## 限流说明

Worker 内置了 IP 限流（每 IP 每 30 秒 1 次），防止滥用。
GitHub API 本身有 5000 req/h 的限流，worker 不计入用户自己的限额。
