import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';
import Svg, { Path, Circle } from 'react-native-svg';

interface Option {
  key: string;
  label: string;
  icon?: 'male' | 'female' | 'other';
}

interface SegmentedControlProps {
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: ViewStyle;
  optionStyle?: ViewStyle;
  textStyle?: TextStyle;
  selectedOptionStyle?: ViewStyle;
  selectedTextStyle?: TextStyle;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  style,
  optionStyle,
  textStyle,
  selectedOptionStyle,
  selectedTextStyle,
}) => {
  const getIconComponent = (iconName?: string, isSelected?: boolean) => {
    if (!iconName) return null;
    
    const iconColor = isSelected ? theme.Colors.textWhite : theme.Colors.textSecondary;
    const size = 20;
    
    const iconPaths: { [key: string]: React.ReactElement } = {
      male: (
        <Svg width={size} height={size} viewBox="0 0 256 256">
          <Path
            d="M 61.374 0 v 6.039 h 18.318 L 57.823 27.907 c -6.124 -5.16 -14.022 -8.278 -22.638 -8.278 C 15.784 19.63 0 35.414 0 54.815 C 0 74.216 15.784 90 35.185 90 s 35.185 -15.784 35.185 -35.185 c 0 -8.616 -3.118 -16.514 -8.278 -22.638 l 21.869 -21.869 v 18.318 H 90 V 0 H 61.374 z M 35.185 83.961 c -16.071 0 -29.147 -13.075 -29.147 -29.146 c 0 -16.071 13.075 -29.147 29.147 -29.147 s 29.147 13.075 29.147 29.147 C 64.332 70.886 51.257 83.961 35.185 83.961 z"
            fill={iconColor}
            transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
          />
        </Svg>
      ),
      
      female: (
        <Svg width={size} height={size} viewBox="0 0 52.857 52.857">
          <Path
            d="M43.021,16.593C43.021,7.444,35.579,0,26.43,0C17.28,0,9.836,7.443,9.836,16.593c0,8.425,6.316,15.387,14.459,16.438
            v10.109h-4.213c-1.178,0-2.133,0.955-2.133,2.133s0.955,2.133,2.133,2.133h4.213v3.318c0,1.178,0.955,2.133,2.135,2.133
            c1.177,0,2.132-0.955,2.132-2.133v-3.318h4.213c1.181,0,2.136-0.955,2.136-2.133s-0.955-2.133-2.136-2.133h-4.213V33.031
            C36.706,31.979,43.021,25.018,43.021,16.593z M14.104,16.593c0-6.797,5.529-12.326,12.326-12.326
            c6.794,0,12.326,5.529,12.326,12.326c0,6.797-5.531,12.326-12.326,12.326C19.633,28.919,14.104,23.39,14.104,16.593z"
            fill={iconColor}
          />
        </Svg>
      ),
      
      other: (
        <Svg width={24} height={24} viewBox="0 0 256 256">
          <Path
            d="M211.9209,23.21582c-.02246-.11328-.06519-.21777-.09693-.32715a3.96647,3.96647,0,0,0-.13012-.41943,3.94126,3.94126,0,0,0-.19385-.36817c-.05811-.10693-.10522-.21777-.17383-.31982a3.99291,3.99291,0,0,0-.49316-.604l-.0044-.00537h0a4.00638,4.00638,0,0,0-.61035-.49854c-.09814-.06543-.20434-.11035-.30664-.1665a2.33028,2.33028,0,0,0-.78784-.32715c-.11377-.03321-.22266-.07715-.34033-.10059A3.99092,3.99092,0,0,0,208,20H168a4,4,0,0,0,0,8h30.34326L164.38574,61.95752A63.97641,63.97641,0,1,0,116,171.8623V200H88a4,4,0,0,0,0,8h28v24a4,4,0,0,0,8,0V208h28a4,4,0,0,0,0-8H124V171.8623A63.94175,63.94175,0,0,0,169.79688,67.85986L204,33.65674V64a4,4,0,0,0,8,0V24.00146A4.03032,4.03032,0,0,0,211.9209,23.21582ZM120,164a56,56,0,1,1,56-56A56.06322,56.06322,0,0,1,120,164Z"
            fill={iconColor}
          />
        </Svg>
      ),
    };
    
    return iconPaths[iconName];
  };

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = option.key === selectedValue;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.option,
              optionStyle,
              isSelected && styles.selectedOption,
              isSelected && selectedOptionStyle,
            ]}
            onPress={() => onValueChange(option.key)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              {option.icon && (
                <View style={styles.iconContainer}>
                  {getIconComponent(option.icon, isSelected)}
                </View>
              )}
              <Text
                style={[
                  styles.text,
                  textStyle,
                  isSelected && styles.selectedText,
                  isSelected && selectedTextStyle,
                ]}
              >
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.Colors.backgroundTertiary,
    borderRadius: theme.BorderRadius.full,
    padding: theme.Spacing.xs,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  option: {
    flex: 1,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: theme.Spacing.sm,
  },
  selectedOption: {
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.full,
    ...theme.Shadows.sm,
  },
  text: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textSecondary,
    fontWeight: theme.Typography.fontWeight.medium,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  selectedText: {
    color: theme.Colors.textWhite,
    fontWeight: theme.Typography.fontWeight.semiBold,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
});

export default SegmentedControl;