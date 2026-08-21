/**
 * Pure-headed theme mapping: generated design tokens → RN style primitives.
 * This file contains NO logic and NO behavior — only visual decisions
 * expressed through @eagle/design-tokens (the single source of truth).
 */
import { theme } from '@eagle/design-tokens/rn';
import { StyleSheet } from 'react-native';

export const t = theme;

/** Shared screen chrome built exclusively from tokens. */
export const screenStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bgCanvas },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  back: { color: theme.colors.accent, fontSize: theme.typography.fontSizeMd },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSizeLg,
    fontWeight: theme.typography.fontWeightBold,
    flex: 1,
  },
  hint: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.xl },
  error: { color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.xl },
  input: {
    backgroundColor: theme.colors.bgSurface,
    color: theme.colors.textPrimary,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  label: { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeSm },
  field: { gap: theme.spacing.xs },
  submit: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md + 2,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: theme.colors.textOnAccent, fontWeight: theme.typography.fontWeightBold },
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizeXs,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
});
