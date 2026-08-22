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
export interface SelectOption {
    value: string;
    label: string;
}
export type SettingItem = {
    type: 'text';
    key: string;
    label: string;
    placeholder?: string;
    secure?: boolean;
} | {
    type: 'select';
    key: string;
    label: string;
    options: SelectOption[];
} | {
    type: 'toggle';
    key: string;
    label: string;
    description?: string;
} | {
    type: 'multi';
    key: string;
    label: string;
    options: SelectOption[];
}
/** Opens a head-registered custom page (page registry keyed by pageId). */
 | {
    type: 'page';
    pageId: string;
    label: string;
    description?: string;
};
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
export interface SettingsHubScreenProps {
    schema: SettingsSchema;
    values: SettingsValues;
    onOpenSection: (sectionId: string) => void;
    onOpenPage: (pageId: string) => void;
}
export declare function SettingsHubScreen({ schema, onOpenSection, onOpenPage }: SettingsHubScreenProps): React.JSX.Element;
export interface SettingsSectionScreenProps {
    section: SettingsSection;
    values: SettingsValues;
    /** Store the new value for an item key (head persists). */
    onChange: (key: string, value: unknown) => void;
    onOpenPage: (pageId: string) => void;
}
export declare function SettingsSectionScreen({ section, values, onChange, onOpenPage }: SettingsSectionScreenProps): React.JSX.Element;
import React from 'react';
//# sourceMappingURL=index.d.ts.map