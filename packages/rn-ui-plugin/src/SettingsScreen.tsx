/**
 * Pure-headed settings screen: two headless controllers drive everything —
 * SourcesController (configured list) and AddSourceFormController (form).
 * Fields render from plugin.formFields; styling is 100% design tokens.
 */
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { AddSourceFormController, HealthController, SourcesController } from '@eagle/headless-ui';
import { useAddSourceForm, useHealth, useSources } from '@eagle/headless-ui';
import { t } from './theme.js';

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
  const plugins = useMemo(() => form.plugins(), [form]);
  const active = formState.kind ?? plugins[0]?.kind ?? '';

  React.useEffect(() => {
    if (!formState.kind && plugins.length > 0) form.select(plugins[0]!.kind);
  }, [form, formState.kind, plugins]);

  const fields = plugins.find((p) => p.kind === active)?.formFields ?? [];

  async function submit(): Promise<void> {
    await form.submit();
    const st = form.getState();
    if (st.status === 'success') {
      Alert.alert('已添加');
      onBack();
    } else if (st.status === 'error' && st.errorMessage) {
      Alert.alert('添加失败', st.errorMessage);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.navbar}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.title}>直播源管理</Text>
      </View>

      <Text style={styles.section}>已配置的源</Text>
      {configured.length === 0 && <Text style={styles.hint}>暂无。添加第一个源以开始。</Text>}
      {configured.map((s) => (
        <View key={s.id} style={styles.sourceRow}>
          <Text style={styles.sourceKind}>{s.kind}</Text>
          <Text style={styles.sourceLabel} numberOfLines={1}>
            {s.label}
          </Text>
          <Pressable onPress={() => void sources.remove(s.id)}>
            <Text style={styles.remove}>删除</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.section}>播放源体检</Text>
      <View style={styles.prefRow}>
        <View style={styles.prefText}>
          <Text style={styles.prefTitle}>刷新时自动体检</Text>
          <Text style={styles.prefDesc}>每次刷新频道列表时后台探测坏源</Text>
        </View>
        <Switch
          value={healthState.checkOnRefresh}
          onValueChange={(v) => void health.setCheckOnRefresh(v)}
          trackColor={{ true: t.colors.accent }}
        />
      </View>
      <View style={styles.prefRow}>
        <View style={styles.prefText}>
          <Text style={styles.prefTitle}>隐藏坏台</Text>
          <Text style={styles.prefDesc}>探测失败的频道自动从列表隐藏</Text>
        </View>
        <Switch
          value={healthState.hideBad}
          onValueChange={(v) => void health.setHideBad(v)}
          trackColor={{ true: t.colors.accent }}
        />
      </View>
      <Pressable
        style={styles.recheckBtn}
        onPress={() => {
          health.forget();
          Alert.alert('已重置体检结果', '返回列表刷新后将重新体检全部频道。');
        }}
      >
        <Text style={styles.recheckText}>重置体检结果</Text>
      </Pressable>

      <Text style={styles.section}>添加源（按已注册插件）</Text>
      <View style={styles.tabs}>
        {plugins.map((p) => (
          <Pressable
            key={p.kind}
            onPress={() => form.select(p.kind)}
            style={[styles.tab, active === p.kind && styles.tabActive]}
          >
            <Text style={[styles.tabText, active === p.kind && styles.tabTextActive]}>
              {p.displayName}
            </Text>
          </Pressable>
        ))}
      </View>

      {fields.map((f) => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={formState.values[f.key] ?? ''}
            onChangeText={(v) => form.setValue(f.key, v)}
            placeholder={'placeholder' in f ? f.placeholder : undefined}
            placeholderTextColor={t.colors.textDisabled}
            secureTextEntry={f.secure}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ))}

      {formState.status === 'error' && formState.errorMessage && (
        <Text style={styles.formError}>{formState.errorMessage}</Text>
      )}

      <Pressable
        style={[styles.submit, formState.status === 'submitting' && styles.submitDisabled]}
        disabled={formState.status === 'submitting'}
        onPress={submit}
      >
        <Text style={styles.submitText}>
          {formState.status === 'submitting' ? '验证中…' : '添加'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.colors.bgCanvas },
  content: { padding: t.spacing.lg, gap: t.spacing.sm },
  navbar: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  back: { color: t.colors.accent, fontSize: t.typography.fontSizeMd },
  title: { color: t.colors.textPrimary, fontSize: t.typography.fontSizeLg, fontWeight: t.typography.fontWeightBold },
  section: {
    color: t.colors.textSecondary,
    fontSize: t.typography.fontSizeXs,
    marginTop: t.spacing.lg,
    marginBottom: t.spacing.xs,
    textTransform: 'uppercase',
  },
  hint: { color: t.colors.textDisabled },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    backgroundColor: t.colors.bgSurface,
    borderRadius: 8,
    marginBottom: t.spacing.xs,
  },
  prefText: { flex: 1, paddingRight: t.spacing.md },
  prefTitle: { color: t.colors.textPrimary, fontSize: t.typography.fontSizeSm },
  prefDesc: { color: t.colors.textSecondary, fontSize: t.typography.fontSizeXs, marginTop: 2 },
  recheckBtn: {
    alignSelf: 'flex-start',
    paddingVertical: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    marginTop: t.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  recheckText: { color: t.colors.accent, fontSize: t.typography.fontSizeSm },
  formError: { color: t.colors.danger, fontSize: t.typography.fontSizeSm },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    backgroundColor: t.colors.bgSurface,
    borderRadius: t.radii.md,
    padding: t.spacing.sm + 2,
  },
  sourceKind: {
    color: t.colors.accent,
    fontSize: t.typography.fontSizeXs,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
    borderRadius: t.radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  sourceLabel: { flex: 1, color: t.colors.textPrimary },
  remove: { color: t.colors.danger },
  tabs: { flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' },
  tab: {
    paddingVertical: t.spacing.sm,
    paddingHorizontal: 14,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.bgSurface,
  },
  tabActive: { backgroundColor: t.colors.accent },
  tabText: { color: t.colors.textSecondary, fontSize: t.typography.fontSizeSm },
  tabTextActive: { color: t.colors.textOnAccent },
  field: { gap: t.spacing.xs },
  label: { color: t.colors.textSecondary, fontSize: t.typography.fontSizeSm },
  input: {
    backgroundColor: t.colors.bgSurface,
    color: t.colors.textPrimary,
    borderRadius: t.radii.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 10,
  },
  submit: {
    backgroundColor: t.colors.accent,
    borderRadius: t.radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: t.spacing.sm,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: t.colors.textOnAccent, fontWeight: t.typography.fontWeightBold },
});
