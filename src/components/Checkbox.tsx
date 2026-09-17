import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';
import { CheckIcon } from './Icons';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onPress,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <CheckIcon size={14} color={theme.Colors.textWhite} />}
      </View>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.BorderRadius.sm,
    borderWidth: 2,
    borderColor: theme.Colors.border,
    backgroundColor: theme.Colors.backgroundSecondary,
    marginRight: theme.Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.Colors.success,
    borderColor: theme.Colors.success,
  },
  label: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.text,
    fontWeight: theme.Typography.fontWeight.normal,
    fontFamily: theme.Typography.fontFamily.regular,
  },
});

export default Checkbox;