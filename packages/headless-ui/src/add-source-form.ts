/**
 * AddSourceForm controller — behavior for the plugin-driven "add source"
 * form: which plugin is active, field values, validation, submission state.
 * The head renders plugin.formFields generically; this owns everything else.
 */
import type { SourcePlugin, PluginConnection } from '@eagle/core';

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface AddSourceFormState {
  /** Active plugin kind. */
  kind: string | null;
  values: Record<string, string>;
  status: FormStatus;
  errorMessage: string | null;
  /** Set after a successful submit (head navigates away). */
  created: PluginConnection | null;
  version: number;
}

export interface AddSourceFormDeps {
  plugins: SourcePlugin[];
  /** Perform the connect (usually a wrapper over EagleCore.addSource). */
  submit: (kind: string, values: Record<string, string>) => Promise<PluginConnection>;
}

export class AddSourceFormController {
  private state: AddSourceFormState = {
    kind: null,
    values: {},
    status: 'idle',
    errorMessage: null,
    created: null,
    version: 0,
  };
  private listeners = new Set<() => void>();
  private deps: AddSourceFormDeps;

  constructor(deps: AddSourceFormDeps) {
    this.deps = deps;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): AddSourceFormState => this.state;

  private set(patch: Partial<AddSourceFormState>): void {
    this.state = { ...this.state, ...patch, version: this.state.version + 1 };
    for (const l of this.listeners) l();
  }

  /* ---------- selectors ---------- */

  /** All registered plugins (for tab bars). */
  plugins(): SourcePlugin[] {
    return this.deps.plugins;
  }

  activePlugin(): SourcePlugin | null {
    return this.deps.plugins.find((p) => p.kind === this.state.kind) ?? null;
  }

  /** Required-but-empty field keys (client-side pre-validation). */
  missingRequired(): string[] {
    const plugin = this.activePlugin();
    if (!plugin?.formFields) return [];
    return plugin.formFields
      .filter((f) => !(this.state.values[f.key] ?? '').trim())
      .map((f) => f.key);
  }

  /* ---------- transitions ---------- */

  /** Select a plugin tab; clears values (fields differ per plugin). */
  select(kind: string): void {
    this.set({ kind, values: {}, status: 'idle', errorMessage: null, created: null });
  }

  setValue(key: string, value: string): void {
    this.set({ values: { ...this.state.values, [key]: value } });
  }

  async submit(): Promise<void> {
    const plugin = this.activePlugin();
    if (!plugin || this.state.status === 'submitting') return;
    if (this.missingRequired().length > 0) {
      this.set({ status: 'error', errorMessage: '请填写所有必填项' });
      return;
    }
    this.set({ status: 'submitting', errorMessage: null });
    try {
      const created = await this.deps.submit(plugin.kind, { ...this.state.values });
      this.set({ status: 'success', created });
    } catch (e) {
      this.set({
        status: 'error',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  /** Reset for reuse after success navigation. */
  reset(): void {
    this.set({
      values: {},
      status: 'idle',
      errorMessage: null,
      created: null,
    });
  }
}
