/**
 * @eagle/settings-ui — hierarchical settings plugin.
 *
 * Settings are DECLARED as a schema: sections → items. Item types cover
 * the common controls (text input, select, toggle, multi-select) plus a
 * "page" type that opens a head-provided custom screen (fully custom
 * development, e.g. 数据源管理). The hub renders level 1 (sections);
 * a section route renders level 2 (controls bound to the settings
 * store). Pure RN syntax; shared web + native.
 */

// ---------------------------------------------------------------------------
// Schema types (a settings "plugin" exports a SettingsSchema)
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
}

export type SettingItem =
  | { type: 'text'; key: string; label: string; placeholder?: string; secure?: boolean }
  | { type: 'select'; key: string; label: string; options: SelectOption[] }
  | { type: 'toggle'; key: string; label: string; description?: string }
  | { type: 'multi'; key: string; label: string; options: SelectOption[] }
  /** Opens a head-registered custom page (page registry keyed by pageId). */
  | { type: 'page'; pageId: string; label: string; description?: string };

export interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  items: SettingItem[];
}

export interface SettingsSchema {
  sections: SettingsSection[];
}

export type SettingsValues = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Level 1: hub (section list)
// ---------------------------------------------------------------------------

export interface SettingsHubScreenProps {
  schema: SettingsSchema;
  values: SettingsValues;
  onOpenSection: (sectionId: string) => void;
  onOpenPage: (pageId: string) => void;
}

export function SettingsHubScreen({ schema, onOpenSection, onOpenPage }: SettingsHubScreenProps): React.JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>设置</Text>
      {schema.sections.map((sec) => (
        <Pressable
          key={sec.id}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => onOpenSection(sec.id)}
          accessibilityRole="button"
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.rowTitle}>{sec.title}</Text>
            {sec.description ? <Text style={styles.rowSub} numberOfLines={1}>{sec.description}</Text> : null}
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Level 2: one section's controls
// ---------------------------------------------------------------------------

export interface SettingsSectionScreenProps {
  section: SettingsSection;
  values: SettingsValues;
  /** Store the new value for an item key (head persists). */
  onChange: (key: string, value: unknown) => void;
  onOpenPage: (pageId: string) => void;
}

export function SettingsSectionScreen({ section, values, onChange, onOpenPage }: SettingsSectionScreenProps): React.JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{section.title}</Text>
      {section.items.map((item) => (
        <SettingRow key={'pageId' in item ? item.pageId : item.key} item={item} values={values} onChange={onChange} onOpenPage={onOpenPage} />
      ))}
    </View>
  );
}

function SettingRow({ item, values, onChange, onOpenPage }: { item: SettingItem; values: SettingsValues; onChange: (k: string, v: unknown) => void; onOpenPage: (id: string) => void }): React.JSX.Element {
  switch (item.type) {
    case 'text':
      return (
        <View style={styles.controlBlock}>
          <Text style={styles.label}>{item.label}</Text>
          <TextInput
            style={styles.input}
            value={String(values[item.key] ?? '')}
            placeholder={item.placeholder}
            placeholderTextColor="#5b6472"
            secureTextEntry={item.secure}
            onChangeText={(t) => onChange(item.key, t)}
          />
        </View>
      );
    case 'select': {
      const current = String(values[item.key] ?? '');
      return (
        <View style={styles.controlBlock}>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.chipRow}>
            {item.options.map((o) => {
              const active = o.value === current;
              return (
                <Pressable key={o.value} onPress={() => onChange(item.key, o.value)} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }
    case 'toggle': {
      const on = values[item.key] === true;
      return (
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => onChange(item.key, !on)} accessibilityRole="switch" accessibilityState={{ checked: on }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.rowTitle}>{item.label}</Text>
            {item.description ? <Text style={styles.rowSub} numberOfLines={2}>{item.description}</Text> : null}
          </View>
          <View style={[styles.switchTrack, on && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, on && styles.switchThumbOn]} />
          </View>
        </Pressable>
      );
    }
    case 'multi': {
      const selected = new Set((values[item.key] as string[]) ?? []);
      return (
        <View style={styles.controlBlock}>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.chipRow}>
            {item.options.map((o) => {
              const active = selected.has(o.value);
              return (
                <Pressable
                  key={o.value}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                  onPress={() => {
                    const next = new Set(selected);
                    if (active) next.delete(o.value);
                    else next.add(o.value);
                    onChange(item.key, [...next]);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }
    case 'page':
      return (
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => onOpenPage(item.pageId)} accessibilityRole="button">
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.rowTitle}>{item.label}</Text>
            {item.description ? <Text style={styles.rowSub} numberOfLines={1}>{item.description}</Text> : null}
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      );
  }
}

import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const styles = StyleSheet.create({
  root: { padding: 20, gap: 8, maxWidth: 720, width: '100%', alignSelf: 'flex-start' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: '#141922', borderRadius: 12, borderWidth: 1, borderColor: '#1d232d',
  },
  rowTitle: { color: '#e6e9ef', fontSize: 15 },
  rowSub: { color: '#8b93a1', fontSize: 12 },
  chevron: { color: '#5b6472', fontSize: 18 },
  controlBlock: { padding: 14, backgroundColor: '#141922', borderRadius: 12, borderWidth: 1, borderColor: '#1d232d', gap: 8 },
  label: { color: '#e6e9ef', fontSize: 15 },
  input: {
    color: '#fff', backgroundColor: '#0e1116', borderRadius: 8, borderWidth: 1, borderColor: '#2a313c',
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#0e1116', borderWidth: 1, borderColor: '#2a313c' },
  chipActive: { backgroundColor: 'rgba(91,137,255,0.18)', borderColor: '#5b89ff' },
  chipText: { color: '#aeb6c2', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  switchTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#2a313c', padding: 3, justifyContent: 'center' },
  switchTrackOn: { backgroundColor: '#5b89ff' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  switchThumbOn: { alignSelf: 'flex-end' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
