/**
 * Pure-headed settings screen (web/Tauri): two headless controllers drive
 * everything — SourcesController (configured list) and AddSourceFormController
 * (form). Fields render from plugin.formFields; styling is 100% tokens.
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { AddSourceFormController, HealthController, SourcesController } from '@eagle/headless-ui';
import { useAddSourceForm, useHealth, useSources } from '@eagle/headless-ui';

interface ToastMsg {
  message: string;
  kind: 'success' | 'error' | 'info';
}

export interface SettingsScreenProps {
  form: AddSourceFormController;
  sources: SourcesController;
  health: HealthController;
  onBack: () => void;
}

export function SettingsScreen({ form, sources, health, onBack }: SettingsScreenProps) {
  const formState = useAddSourceForm(form);
  const { sources: configured } = useSources(sources);
  const healthState = useHealth(health);
  const [toast, setToast] = useState<ToastMsg | null>(null);

  // Minimal local toast (web heads don't need a cross-screen provider).
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 4000 : 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const plugins = useMemo(() => form.plugins(), [form]);
  const active = formState.kind ?? plugins[0]?.kind ?? '';

  useEffect(() => {
    if (!formState.kind && plugins.length > 0) form.select(plugins[0]!.kind);
  }, [form, formState.kind, plugins]);

  const fields = plugins.find((p) => p.kind === active)?.formFields ?? [];

  async function submit(): Promise<void> {
    await form.submit();
    const st = form.getState();
    if (st.status === 'success') {
      setToast({ message: '已添加，正在体检新频道…', kind: 'success' });
      onBack();
    } else if (st.status === 'error' && st.errorMessage) {
      setToast({ message: `添加失败：${st.errorMessage}`, kind: 'error' });
    }
  }

  return (
    <div className="settings-root">
      <div className="navbar">
        <button className="nav-back" onClick={onBack}>
          ‹ 返回
        </button>
        <span className="nav-title">直播源管理</span>
      </div>

      <div className="section">已配置的源</div>
      {configured.length === 0 && <div className="hint">暂无。添加第一个源以开始。</div>}
      {configured.map((s) => (
        <div key={s.id} className="source-row">
          <span className="badge">{s.kind}</span>
          <span className="source-label">{s.label}</span>
          <button className="remove" onClick={() => void sources.remove(s.id)}>
            删除
          </button>
        </div>
      ))}

      <div className="section">播放源体检</div>
      <div className="pref-row">
        <div>
          <div className="pref-title">刷新时自动体检</div>
          <div className="pref-desc">每次刷新频道列表时后台探测坏源</div>
        </div>
        <button
          className="switch"
          data-on={healthState.checkOnRefresh}
          role="switch"
          aria-checked={healthState.checkOnRefresh}
          onClick={() => void health.setCheckOnRefresh(!healthState.checkOnRefresh)}
        />
      </div>
      <div className="pref-row">
        <div>
          <div className="pref-title">隐藏坏台</div>
          <div className="pref-desc">探测失败的频道自动从列表隐藏</div>
        </div>
        <button
          className="switch"
          data-on={healthState.hideBad}
          role="switch"
          aria-checked={healthState.hideBad}
          onClick={() => void health.setHideBad(!healthState.hideBad)}
        />
      </div>
      <button
        className="recheck-btn"
        onClick={() => {
          health.forget();
          setToast({ message: '体检结果已重置，刷新列表后重新体检', kind: 'info' });
        }}
      >
        重置体检结果
      </button>

      <div className="section">添加源（按已注册插件）</div>
      <div className="tabs">
        {plugins.map((p) => (
          <button
            key={p.kind}
            className={`tab${active === p.kind ? ' tab-active' : ''}`}
            onClick={() => form.select(p.kind)}
          >
            {p.displayName}
          </button>
        ))}
      </div>

      {fields.map((f) => (
        <div key={f.key} className="field">
          <label className="label">{f.label}</label>
          <input
            className="input"
            value={formState.values[f.key] ?? ''}
            onChange={(e) => form.setValue(f.key, e.target.value)}
            placeholder={'placeholder' in f ? f.placeholder : undefined}
            type={f.secure ? 'password' : 'text'}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      ))}

      {formState.status === 'error' && formState.errorMessage && (
        <div className="form-error">{formState.errorMessage}</div>
      )}

      <button
        className="submit"
        disabled={formState.status === 'submitting'}
        onClick={() => void submit()}
      >
        {formState.status === 'submitting' ? '验证中…' : '添加'}
      </button>

      {toast && <div className={`toast${toast.kind === 'error' ? ' toast-error' : ''}`}>{toast.message}</div>}
    </div>
  );
}
