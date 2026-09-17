import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  selectedStyle?: ViewStyle;
  selectedTextStyle?: TextStyle;
}

const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  style,
  textStyle,
  selectedStyle,
  selectedTextStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        style,
        selected && styles.selectedChip,
        selected && selectedStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          textStyle,
          selected && styles.selectedChipText,
          selected && selectedTextStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.full,
    paddingVertical: theme.Spacing.sm,
    paddingHorizontal: theme.Spacing.md,
    marginRight: theme.Spacing.xs,
    marginBottom: theme.Spacing.xs,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
    ...theme.Shadows.sm,
  },
  selectedChip: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
    ...theme.Shadows.md,
  },
  chipText: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    fontWeight: theme.Typography.fontWeight.medium,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  selectedChipText: {
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default Chip;