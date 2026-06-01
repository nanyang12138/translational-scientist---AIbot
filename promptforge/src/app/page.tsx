"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  EvaluationReport,
  PromptIntent,
  PromptVersion,
  RuntimeInfo,
  StructuredPrompt,
  TaskType,
  TestCase,
} from "@/lib/types";
import { TASK_TYPES } from "@/lib/taskTypes";

let cidSeq = 1;
const newCaseId = () => `c${cidSeq++}`;

export default function Home() {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);

  // 意图
  const [goal, setGoal] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("general");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");

  // 产物
  const [prompt, setPrompt] = useState<StructuredPrompt | null>(null);
  const [rendered, setRendered] = useState("");
  const [versions, setVersions] = useState<PromptVersion[]>([]);

  // 测试
  const [cases, setCases] = useState<TestCase[]>([
    { id: newCaseId(), input: "", expectation: "" },
  ]);
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);

  // 状态
  const [synthLoading, setSynthLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [optLoading, setOptLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/runtime")
      .then((r) => r.json())
      .then((d) => setRuntime(d.runtime))
      .catch(() => setRuntime({ mode: "mock" }));
  }, []);

  const buildIntent = useCallback((): PromptIntent => {
    return {
      goal: goal.trim(),
      taskType,
      audience: audience.trim() || undefined,
      tone: tone.trim() || undefined,
      inputFormat: inputFormat.trim() || undefined,
      outputFormat: outputFormat.trim() || undefined,
      constraints: constraints
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }, [goal, taskType, audience, tone, inputFormat, outputFormat, constraints]);

  const pushVersion = useCallback(
    (p: StructuredPrompt, r: string, changeNote: string, evalRep?: EvaluationReport) => {
      setVersions((prev) => [
        ...prev,
        {
          version: prev.length + 1,
          prompt: p,
          rendered: r,
          changeNote,
          evaluation: evalRep,
          createdAt: Date.now(),
        },
      ]);
    },
    [],
  );

  const handleSynthesize = useCallback(async () => {
    if (!goal.trim()) {
      setError("请先描述你想让模型完成的目标。");
      return;
    }
    setError("");
    setSynthLoading(true);
    setEvaluation(null);
    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: buildIntent() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "合成失败");
      setPrompt(data.prompt);
      setRendered(data.rendered);
      setRuntime(data.runtime);
      setVersions([]);
      pushVersion(data.prompt, data.rendered, "初始合成");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "合成失败");
    } finally {
      setSynthLoading(false);
    }
  }, [goal, buildIntent, pushVersion]);

  const handleEvaluate = useCallback(async () => {
    if (!prompt) return;
    const valid = cases.filter((c) => c.input.trim());
    if (valid.length === 0) {
      setError("请至少填写一个测试用例的输入。");
      return;
    }
    setError("");
    setEvalLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, cases: valid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "评估失败");
      setEvaluation(data.evaluation);
      setRuntime(data.runtime);
      setVersions((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], evaluation: data.evaluation };
        return copy;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "评估失败");
    } finally {
      setEvalLoading(false);
    }
  }, [prompt, cases]);

  const handleOptimize = useCallback(async () => {
    if (!prompt || !evaluation) return;
    setError("");
    setOptLoading(true);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, evaluation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "优化失败");
      setPrompt(data.prompt);
      setRendered(data.rendered);
      setRuntime(data.runtime);
      setEvaluation(null);
      pushVersion(data.prompt, data.rendered, data.changeNote || "自动优化");
    } catch (e) {
      setError(e instanceof Error ? e.message : "优化失败");
    } finally {
      setOptLoading(false);
    }
  }, [prompt, evaluation, pushVersion]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("复制失败,请手动选择文本复制。");
    }
  }, [rendered]);

  const updateCase = (id: string, patch: Partial<TestCase>) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCase = () =>
    setCases((prev) => [...prev, { id: newCaseId(), input: "", expectation: "" }]);
  const removeCase = (id: string) =>
    setCases((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Header runtime={runtime} />

      {error && (
        <div
          className="card mb-6 px-4 py-3 text-sm"
          style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* 左:意图澄清 */}
        <section className="card p-5 md:p-6">
          <StepTitle n={1} title="澄清意图" hint="说清楚你要什么,越具体越好" />

          <label className="label mt-4">目标 *</label>
          <textarea
            className="field min-h-[90px] resize-y"
            placeholder="例如:做一个电商客服助手,回答物流、退换货问题"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />

          <label className="label mt-4">任务类型</label>
          <select
            className="field"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
          >
            {TASK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.description}
              </option>
            ))}
          </select>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="label">目标受众</label>
              <input
                className="field"
                placeholder="如:普通消费者"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <div>
              <label className="label">语气风格</label>
              <input
                className="field"
                placeholder="如:亲切专业"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
            </div>
          </div>

          <label className="label mt-4">输入形态(可选)</label>
          <input
            className="field"
            placeholder="如:用户的一句自然语言提问"
            value={inputFormat}
            onChange={(e) => setInputFormat(e.target.value)}
          />

          <label className="label mt-4">期望输出(可选)</label>
          <input
            className="field"
            placeholder="如:简洁的中文回答,必要时给出步骤"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
          />

          <label className="label mt-4">硬约束(每行一条,可选)</label>
          <textarea
            className="field min-h-[70px] resize-y"
            placeholder={"如:不承诺无法保证的时效\n如:不泄露内部政策"}
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
          />

          <button
            className="btn btn-primary mt-5 w-full"
            onClick={handleSynthesize}
            disabled={synthLoading}
          >
            {synthLoading ? <span className="spin" /> : null}
            {synthLoading ? "合成中…" : "✨ 合成结构化提示词"}
          </button>
        </section>

        {/* 右:产物 + 测试 + 优化 */}
        <div ref={resultRef} className="flex flex-col gap-6">
          {!prompt ? (
            <EmptyState />
          ) : (
            <>
              <PromptCard
                prompt={prompt}
                rendered={rendered}
                copied={copied}
                onCopy={handleCopy}
              />

              <section className="card p-5 md:p-6">
                <StepTitle n={3} title="评估" hint="用测试用例给提示词打分" />
                <div className="mt-4 flex flex-col gap-3">
                  {cases.map((c, i) => (
                    <div key={c.id} className="rounded-xl border p-3" style={{ background: "var(--surface-2)" }}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          用例 {i + 1}
                        </span>
                        <button
                          className="text-xs"
                          style={{ color: "var(--muted)" }}
                          onClick={() => removeCase(c.id)}
                        >
                          删除
                        </button>
                      </div>
                      <input
                        className="field mb-2"
                        placeholder="测试输入"
                        value={c.input}
                        onChange={(e) => updateCase(c.id, { input: e.target.value })}
                      />
                      <input
                        className="field"
                        placeholder="期望表现(可选,用于评分参考)"
                        value={c.expectation}
                        onChange={(e) => updateCase(c.id, { expectation: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-ghost" onClick={addCase}>
                    + 添加用例
                  </button>
                  <button
                    className="btn btn-primary flex-1"
                    onClick={handleEvaluate}
                    disabled={evalLoading}
                  >
                    {evalLoading ? <span className="spin" /> : null}
                    {evalLoading ? "评估中…" : "▶ 运行评估"}
                  </button>
                </div>

                {evaluation && (
                  <EvaluationView
                    evaluation={evaluation}
                    onOptimize={handleOptimize}
                    optLoading={optLoading}
                  />
                )}
              </section>

              {versions.length > 1 && <VersionHistory versions={versions} />}
            </>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-xs" style={{ color: "var(--muted)" }}>
        PromptForge · 澄清 → 合成 → 评估 → 优化 的提示词工程闭环
      </footer>
    </main>
  );
}

function Header({ runtime }: { runtime: RuntimeInfo | null }) {
  return (
    <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
          >
            ⚒
          </span>
          PromptForge
          <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>
            提示词锻造工坊
          </span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          把模糊想法,锻造成规范、可测、可迭代的高质量提示词。
        </p>
      </div>
      {runtime && (
        <span
          className="tag self-start"
          style={{
            color: runtime.mode === "live" ? "var(--success)" : "var(--warning)",
            borderColor: runtime.mode === "live" ? "var(--success)" : "var(--warning)",
          }}
        >
          ● {runtime.mode === "live" ? `已接入模型 (${runtime.model})` : "离线演示模式"}
        </span>
      )}
    </header>
  );
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: "var(--primary)", color: "white" }}
      >
        {n}
      </span>
      <div>
        <h2 className="text-base font-semibold leading-tight">{title}</h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="card flex flex-1 flex-col items-center justify-center p-10 text-center">
      <div className="mb-3 text-4xl">🛠️</div>
      <h3 className="text-lg font-semibold">从左侧描述你的意图开始</h3>
      <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--muted)" }}>
        填好目标后点击「合成」,这里会生成一份结构化提示词。随后你可以用测试用例评估它,并一键自动优化。
      </p>
    </section>
  );
}

function PromptCard({
  prompt,
  rendered,
  copied,
  onCopy,
}: {
  prompt: StructuredPrompt;
  rendered: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="card p-5 md:p-6">
      <div className="flex items-center justify-between">
        <StepTitle n={2} title="结构化提示词" hint="分节结构是稳定性的来源" />
        <button className="btn btn-ghost" onClick={onCopy}>
          {copied ? "✓ 已复制" : "复制"}
        </button>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <Field label="角色" value={prompt.role} />
        <Field label="任务" value={prompt.task} />
        {prompt.context && <Field label="上下文 / 输入" value={prompt.context} />}
        {prompt.constraints?.length > 0 && (
          <div>
            <span className="label">约束</span>
            <ul className="ml-4 list-disc space-y-1">
              {prompt.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {prompt.reasoning && <Field label="推理要求" value={prompt.reasoning} />}
        {prompt.outputFormat && <Field label="输出格式" value={prompt.outputFormat} />}
        {prompt.examples?.length > 0 && (
          <div>
            <span className="label">示例</span>
            <div className="space-y-2">
              {prompt.examples.map((e, i) => (
                <pre
                  key={i}
                  className="overflow-x-auto rounded-lg p-2 text-xs"
                  style={{ background: "var(--surface-2)", fontFamily: "var(--font-mono)" }}
                >
                  {`输入: ${e.input}\n输出: ${e.output}`}
                </pre>
              ))}
            </div>
          </div>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs" style={{ color: "var(--muted)" }}>
          查看可复制的完整 Prompt 文本
        </summary>
        <pre
          className="mt-2 max-h-80 overflow-auto rounded-lg p-3 text-xs"
          style={{ background: "var(--surface-2)", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}
        >
          {rendered}
        </pre>
      </details>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      <p>{value}</p>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 70) return "var(--accent)";
  if (score >= 50) return "var(--warning)";
  return "var(--danger)";
}

function EvaluationView({
  evaluation,
  onOptimize,
  optLoading,
}: {
  evaluation: EvaluationReport;
  onOptimize: () => void;
  optLoading: boolean;
}) {
  return (
    <div className="mt-5 border-t pt-4">
      <div className="mb-3 flex items-center gap-4">
        <ScoreBadge label="平均分" value={evaluation.averageScore} />
        <ScoreBadge label="通过率" value={evaluation.passRate} suffix="%" />
      </div>
      <div className="space-y-2">
        {evaluation.results.map((r) => (
          <div key={r.caseId} className="rounded-lg border p-3 text-sm" style={{ background: "var(--surface-2)" }}>
            <div className="mb-1 flex items-center justify-between">
              <span className="truncate pr-2 text-xs" style={{ color: "var(--muted)" }}>
                {r.input}
              </span>
              <span className="font-bold" style={{ color: scoreColor(r.score) }}>
                {r.score}
              </span>
            </div>
            {r.output && r.output !== "(Mock 模式:未实际调用模型生成输出)" && (
              <p className="mb-1 text-xs">{r.output}</p>
            )}
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {r.feedback}
            </p>
          </div>
        ))}
      </div>
      <button
        className="btn btn-primary mt-4 w-full"
        onClick={onOptimize}
        disabled={optLoading}
      >
        {optLoading ? <span className="spin" /> : null}
        {optLoading ? "优化中…" : "🔁 根据反馈自动优化"}
      </button>
    </div>
  );
}

function ScoreBadge({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span className="text-2xl font-bold" style={{ color: scoreColor(value) }}>
        {value}
        {suffix}
      </span>
    </div>
  );
}

function VersionHistory({ versions }: { versions: PromptVersion[] }) {
  return (
    <section className="card p-5 md:p-6">
      <StepTitle n={4} title="版本历史" hint="对比每次迭代的得分变化" />
      <div className="mt-4 space-y-2">
        {versions.map((v) => (
          <div
            key={v.version}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
            style={{ background: "var(--surface-2)" }}
          >
            <div>
              <span className="font-semibold">v{v.version}</span>
              <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>
                {v.changeNote}
              </span>
            </div>
            {v.evaluation ? (
              <span className="font-bold" style={{ color: scoreColor(v.evaluation.averageScore) }}>
                {v.evaluation.averageScore} 分
              </span>
            ) : (
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                未评估
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
