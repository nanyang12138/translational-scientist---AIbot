# 神已离线 / God Is Offline

一个面向桌面发行的 **agent-native 叙事策略游戏** vertical slice。

玩家扮演圣玻璃城的旧神控制台。每回合只能发布一句自然语言“神谕”,然后多个本地 agent 阵营会各自曲解、利用、反抗这句话,并共同改写城市状态。

## 当前工程形态

- `godot/`: Godot 4 正式游戏工程,目标是桌面端 vertical slice。
- `src/` + `index.html`: 早期 Web 概念原型,保留用于快速验证 agent runtime 思路。
- `test/`: JavaScript 原型的核心玩法测试。
- `tools/validate_godot_project.mjs`: Godot 工程结构校验。
- `tools/agent_bridge_server.mjs`: 本机 LLM Agent Bridge,支持 OpenAI-compatible API、Ollama 和 mock 模式。

## 游戏重点

- **一轮一句神谕**: 玩家不能点菜单控制世界,只能说一句话。
- **多 agent 解释权战争**: 市政厅、教会、商会、黑帮、革命军、媒体和谣言群体分别行动。
- **动态世界状态**: 秩序、信仰、饥饿、动荡、秘密、不平等、自由、财富、猜疑、恐惧都会变化。
- **旧神控制室**: Godot 版包含主菜单、控制室 UI、设置入口、存档、回合报告和终局预言。
- **双模式**: 离线规则 agent 可直接运行; LLM Agent Bridge 可接 API 或本地模型,让世界生成更不可预测的阴谋、来信和阵营记忆。

## 运行 Godot 版

### Windows 免安装包

仓库包含一个 Windows portable 包:

```text
dist/windows/GodIsOffline-Windows.zip
```

使用方式:

1. 下载并解压 `GodIsOffline-Windows.zip`
2. 双击 `God Is Offline.exe`
3. 如果 Windows SmartScreen 提示未知发布者,选择 `更多信息` -> `仍要运行`

这个包由 Godot 4.2.2 release export 生成。默认离线模式不需要 API key。

### 开启 LLM Agent 模式

Windows portable 包里包含:

```text
Start Agent Bridge.bat
```

使用 OpenAI-compatible API:

1. 安装 Node.js LTS
2. 解压 Windows 包
3. 双击 `Start Agent Bridge.bat`
4. 按提示粘贴 API key
5. 启动 `God Is Offline.exe`
6. 进入设置,开启 `LLM Agent 模式`
7. endpoint 保持:

```text
http://127.0.0.1:8787/resolve
```

在开发环境中也可以直接运行:

```bash
OPENAI_API_KEY=你的key npm run start:agent
```

使用 AMD LLM Gateway OpenAI/GPT endpoint（来自 Hermes 文档）:

```bash
LLM_PROVIDER=amd-openai \
AMD_LLM_GATEWAY_KEY=<your-subscription-key> \
LLM_GATEWAY_USER=<your-user> \
npm run start:agent
```

默认会使用:

```text
LLM_BASE_URL=https://llm-api.amd.com/OpenAI
LLM_MODEL=gpt-5.5
LLM_API_KEY=placeholder-key
```

说明:

- AMD gateway 认证靠 `Ocp-Apim-Subscription-Key`,也就是 `AMD_LLM_GATEWAY_KEY`。
- `api_key` 只是 placeholder,任意非空字符串即可。
- `amd-openai` 不会读取 `OPENAI_API_KEY` 或 `LLM_API_KEY`,避免把其它 provider 的真实 key 发给 AMD gateway。
- 如需自定义 placeholder,可设置 `AMD_OPENAI_PLACEHOLDER_KEY`。
- 如果使用 GPT/Codex 模型,优先使用 `/OpenAI` endpoint。
- 如果连接失败且诊断显示 DNS/timeout,通常需要 AMD VPN/内网 DNS。

使用 LLM gateway / AMD OnPrem 风格 OpenAI-compatible API:

```bash
LLM_PROVIDER=gateway \
LLM_BASE_URL=https://llm-api.example.com/OnPrem \
LLM_MODEL=GPT-oss-20B \
LLM_API_KEY=dummy \
LLM_GATEWAY_SUBSCRIPTION_KEY=<your-subscription-key> \
LLM_GATEWAY_USER=<your-user> \
npm run start:agent
```

等价的高级自定义 headers 写法:

```bash
LLM_PROVIDER=gateway \
LLM_BASE_URL=https://llm-api.example.com/OnPrem \
LLM_MODEL=GPT-oss-20B \
LLM_API_KEY=dummy \
LLM_EXTRA_HEADERS_JSON='{"Ocp-Apim-Subscription-Key":"<your-subscription-key>","user":"<your-user>"}' \
npm run start:agent
```

如果你的网关不接受 `response_format`,可以加:

```bash
LLM_DISABLE_RESPONSE_FORMAT=1
```

如果你的网关使用旧参数名 `max_tokens`,可以加:

```bash
LLM_USE_MAX_TOKENS=1
```

如果网关路径不是默认的 `/chat/completions`,可以调整:

```bash
LLM_CHAT_COMPLETIONS_PATH=v1/chat/completions
```

或者直接指定完整 URL:

```bash
LLM_CHAT_COMPLETIONS_URL=https://llm-api.example.com/OnPrem/chat/completions
```

如果网关像某些 OpenAI deployments API 一样使用:

```text
{SERVER}/openai/deployments/{model}/chat/completions
```

可以设置:

```bash
LLM_USE_DEPLOYMENT_PATH=1
```

如果是 Gemini/Vertex 类似路径:

```bash
LLM_DEPLOYMENT_PATH_TEMPLATE=vertex/gemini/deployments/{model}/chat/completions
```

`gpt-5*` 模型会默认使用 `temperature=1.0`,并默认不发送 `response_format`; 如你的网关支持 JSON mode,可显式设置:

```bash
LLM_ENABLE_RESPONSE_FORMAT=1
```

诊断 gateway 连通性:

```bash
LLM_PROVIDER=gateway \
LLM_BASE_URL=https://llm-api.example.com/OnPrem \
LLM_MODEL=GPT-oss-20B \
LLM_API_KEY=dummy \
LLM_GATEWAY_SUBSCRIPTION_KEY=<your-subscription-key> \
LLM_GATEWAY_USER=<your-user> \
LLM_DISABLE_RESPONSE_FORMAT=1 \
npm run test:llm-gateway
```

诊断脚本会隐藏敏感 header,并区分 DNS、超时、401/403、404、400 等问题。

使用 Azure OpenAI:

```bash
LLM_PROVIDER=azure \
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com \
AZURE_OPENAI_DEPLOYMENT=gpt-5.5 \
AZURE_OPENAI_API_VERSION=2025-01-01-preview \
AZURE_OPENAI_API_KEY=<your-azure-key> \
npm run start:agent
```

使用 Ollama 本地模型:

```bash
LLM_PROVIDER=ollama LLM_MODEL=llama3.1 npm run start:agent
```

架构原则:

- LLM 生成阵营行动、新闻、NPC 来信、阴谋线索和记忆补丁。
- Godot 本地规则引擎校验所有 delta、阵营 ID、文本长度和存档结构。
- bridge 失败时游戏自动回退离线规则 agent。
- 不要把真实 API key 或 subscription key 写入仓库; 通过环境变量或 Windows 启动脚本输入。

### 从 Godot 编辑器运行

安装 Godot 4.2+ 后打开:

```text
godot/project.godot
```

在 Godot 编辑器中点击 Run,主场景是:

```text
res://scenes/main.tscn
```

项目已包含 Windows/Linux/macOS 的导出预设:

```text
godot/export_presets.cfg
```

### 重新导出 Windows 包

在 Linux 环境可运行:

```bash
./tools/export_windows_release.sh
```

脚本会下载 Godot 4.2.2 和 Windows export templates,执行 headless 项目解析,导出 exe,并重新生成 `dist/windows/GodIsOffline-Windows.zip`。

## 运行 Web 概念原型

```bash
npm start
```

然后打开:

```text
http://localhost:5173
```

## 测试

```bash
npm test
```

测试覆盖神谕主题识别、阵营 agent 输出、世界状态变更、歧义风险、空输入校验、Agent Bridge 输出清洗,并对 Godot 工程配置/数据/脚本/导出预设做基础静态结构校验。

## 后续可扩展方向

- 给关键 NPC 增加长期记忆、关系网和可视化密谋链。
- 增加章节化事件、派系谈判、终局判定和失败结局。
- 建立正式美术/音频资产管线: 控制室场景、阵营徽记、动态城市投影、环境音乐和音效。
- 补充 Godot CLI 环境后增加 GDScript 解析/无头启动验证和桌面导出自动化。
