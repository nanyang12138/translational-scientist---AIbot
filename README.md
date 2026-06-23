# 神已离线 / God Is Offline

一个面向桌面发行的 **agent-native 叙事策略游戏** vertical slice。

玩家扮演圣玻璃城的旧神控制台。每回合只能发布一句自然语言“神谕”,然后多个本地 agent 阵营会各自曲解、利用、反抗这句话,并共同改写城市状态。

## 当前工程形态

- `godot/`: Godot 4 正式游戏工程,目标是桌面端 vertical slice。
- `src/` + `index.html`: 早期 Web 概念原型,保留用于快速验证 agent runtime 思路。
- `test/`: JavaScript 原型的核心玩法测试。
- `tools/validate_godot_project.mjs`: Godot 工程结构校验。

## 游戏重点

- **一轮一句神谕**: 玩家不能点菜单控制世界,只能说一句话。
- **多 agent 解释权战争**: 市政厅、教会、商会、黑帮、革命军、媒体和谣言群体分别行动。
- **动态世界状态**: 秩序、信仰、饥饿、动荡、秘密、不平等、自由、财富、猜疑、恐惧都会变化。
- **旧神控制室**: Godot 版包含主菜单、控制室 UI、设置入口、存档、回合报告和终局预言。
- **无外部依赖**: 当前 vertical slice 使用可替换的本地 agent runtime,无需 LLM API key 即可运行。

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

这个包由 Godot 4.2.2 release export 生成。

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

测试覆盖神谕主题识别、阵营 agent 输出、世界状态变更、歧义风险、空输入校验,并对 Godot 工程配置/数据/脚本/导出预设做基础静态结构校验。

## 后续可扩展方向

- 将 `godot/scripts/oracle_engine.gd` 中的本地 persona agent 替换为真实 LLM agent。
- 给关键 NPC 增加长期记忆、关系网和可视化密谋链。
- 增加章节化事件、派系谈判、终局判定和失败结局。
- 建立正式美术/音频资产管线: 控制室场景、阵营徽记、动态城市投影、环境音乐和音效。
- 补充 Godot CLI 环境后增加 GDScript 解析/无头启动验证和桌面导出自动化。
