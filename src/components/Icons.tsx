import React, { useEffect, useRef } from 'react';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { Animated, Easing, View } from 'react-native';
import { theme } from '../constants/theme';

interface IconProps {
  name: 'person' | 'email' | 'lock' | 'eye' | 'eye-off' | 'calendar' | 'phone' | 'check' | 'male' | 'female' | 'other';
  size?: number;
  color?: string;
  style?: any;
}

interface IndividualIconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const UserIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={2} />
  </Svg>
);

export const EmailIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="m22 6-10 7L2 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LockIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} stroke={color} strokeWidth={2} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EyeIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
  </Svg>
);

export const EyeOffIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="m1 1 22 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckIcon: React.FC<IndividualIconProps> = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PhoneIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Navigation Icons
export const FeedIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12h18M3 6h18M3 18h18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CalendarIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} stroke={color} strokeWidth={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProfileIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={2} />
  </Svg>
);

export const ChevronLeftIcon: React.FC<IndividualIconProps> = ({ size = 24, color = '#111827' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// News Card Icons
export const BookmarkIcon: React.FC<IndividualIconProps & { filled?: boolean }> = ({ size = 20, color = '#6B7280', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? color : 'none'}
    />
  </Svg>
);

export const ShareIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={2} />
    <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={2} />
    <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={2} />
    <Path d="M8.59 13.51l6.83 3.98" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15.41 6.51l-6.82 3.98" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EditIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SettingsIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DocumentIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="14,2 14,8 20,8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="10,9 9,9 8,9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PrivacyIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ContactIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LogoutIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="16,17 21,12 16,7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const DeleteIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const AutoPlayIcon: React.FC<IndividualIconProps & { active?: boolean }> = ({ size = 20, color = '#6B7280', active = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {active ? (
      // Active auto-play icon (filled)
      <>
        <Path
          d="M8 5v14l11-7z"
          fill={color}
        />
        <Path
          d="M3 3h2v18H3z"
          fill={color}
        />
        <Path
          d="M19 3h2v18h-2z"
          fill={color}
        />
      </>
    ) : (
      // Inactive auto-play icon (outline)
      <>
        <Path
          d="M8 5v14l11-7z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M3 3h2v18H3z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M19 3h2v18h-2z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    )}
  </Svg>
);

export const InfiniteIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#10B981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.63636 16C2.90909 16 2 14 2 12C2 10 2.90909 8 5.63636 8C9.27273 8 14.7273 16 18.3636 16C21.0909 16 22 14 22 12C22 10 21.0909 8 18.3636 8C14.7273 8 9.27273 16 5.63636 16Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FilterIcon: React.FC<IndividualIconProps> = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Three horizontal lines with circles */}
    <Line x1="6" y1="8" x2="18" y2="8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="8" cy="8" r="1.5" fill={color} />
    <Line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Line x1="6" y1="16" x2="18" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="16" cy="16" r="1.5" fill={color} />
  </Svg>
);

const speakerSvgXml = `<svg fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 492.308 492.308" xml:space="preserve">
<g>
	<g>
		<path d="M125.762,139.214H29.538C13.25,139.214,0,152.464,0,168.752v154.813c0,16.288,13.25,29.538,29.539,29.538h96.237
			L313.087,489.56V2.748L125.762,139.214z M119.13,333.411H29.538c-5.428,0-9.846-4.418-9.846-9.846V168.752
			c0-5.428,4.418-9.846,9.846-9.846h89.591V333.411z M293.394,450.849L138.822,338.243V154.065L293.394,41.459V450.849z"/>
	</g>
</g>
<g>
	<g>
		<path d="M425.692,85.099l-13.923,13.923c39.236,39.236,60.846,91.49,60.846,147.135c0,55.639-21.611,107.894-60.846,147.135
			l13.923,13.923c42.957-42.957,66.615-100.154,66.615-161.058C492.308,185.252,468.649,128.055,425.692,85.099z"/>
	</g>
</g>
<g>
	<g>
		<path d="M370.014,139.786l-13.923,13.923c50.976,50.976,50.976,133.918,0,184.894l13.923,13.923
			C428.668,293.873,428.668,198.44,370.014,139.786z"/>
	</g>
</g>
</svg>`;

const createColoredSpeakerXml = (xml: string, color: string) => {
  // Replace all fill="#000000" with the desired color and add stroke for thicker appearance
  let colored = xml.replace(/fill="#000000"/gi, `fill="${color}"`);
  // Add stroke to paths to make them appear thicker (stroke-width relative to viewBox)
  colored = colored.replace(/<path d=/gi, `<path stroke="${color}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" d=`);
  return colored;
};

export const SpeakerIcon: React.FC<IndividualIconProps & { active?: boolean }> = ({ size = 20, color = '#6B7280', active = false }) => {
  // Use the same color for both active and inactive, but you can adjust if needed
  const iconColor = active ? color : color;
  return (
    <SvgXml 
      xml={createColoredSpeakerXml(speakerSvgXml, iconColor)} 
      width={size} 
      height={size} 
    />
  );
};

export const AnimatedSuccessIcon: React.FC<{ size?: number; color?: string }> = ({ size = 88, color = theme.Colors.primary }) => {
  const circleScale = useRef(new Animated.Value(0.6)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.8)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const checkProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    circleScale.setValue(0.6);
    circleOpacity.setValue(0);
    pulseScale.setValue(0.8);
    pulseOpacity.setValue(0);
    checkProgress.setValue(0);

    Animated.parallel([
      Animated.spring(circleScale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(circleOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(140),
      Animated.parallel([
        Animated.timing(pulseOpacity, {
          toValue: 0.35,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(pulseScale, {
          toValue: 1.05,
          tension: 25,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1.45,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.timing(checkProgress, {
      toValue: 1,
      duration: 520,
      delay: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [circleScale, circleOpacity, pulseScale, pulseOpacity, checkProgress, size, color]);

  const normalized = size / 64;
  const strokeWidth = Math.max(2, 6 * normalized * 1.4);
  const basePathLength = 48;
  const pathLength = basePathLength * normalized;

  const dashOffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLength, 0],
    extrapolate: 'clamp',
  });

  const haloSize = size * 1.4;
  const haloBorderWidth = size * 0.06;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          borderWidth: haloBorderWidth,
          borderColor: color,
          opacity: pulseOpacity,
          transform: [{ scale: pulseScale }],
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: circleScale }],
          opacity: circleOpacity,
          shadowColor: color,
          shadowOpacity: 0.35,
          shadowRadius: size * 0.16,
          shadowOffset: { width: 0, height: size * 0.08 },
          elevation: size * 0.12,
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: (size * 0.8) / 2,
          backgroundColor: 'rgba(255,255,255,0.12)',
          opacity: circleOpacity,
          transform: [{ scale: circleScale }],
        }}
      />

      <AnimatedSvg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        style={{ position: 'absolute' }}
      >
        <AnimatedPath
          d="M18 34 L28 44 L46 24"
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={[pathLength]}
          strokeDashoffset={dashOffset}
        />
      </AnimatedSvg>
    </View>
  );
};

const createColoredXml = (xml: string, color: string) => xml.replace(/currentColor/gi, color);

const maleSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90" fill="none"><path d="M61.374 0v6.039h18.318L57.823 27.907c-6.124-5.16-14.022-8.278-22.638-8.278C15.784 19.63 0 35.414 0 54.815 0 74.216 15.784 90 35.185 90s35.185-15.784 35.185-35.185c0-8.616-3.118-16.514-8.278-22.638l21.869-21.869v18.318H90V0H61.374zM35.185 83.961c-16.071 0-29.147-13.075-29.147-29.146 0-16.071 13.075-29.147 29.147-29.147s29.147 13.075 29.147 29.147c0 16.071-13.075 29.146-29.147 29.146z" fill="currentColor"/></svg>`;

const femaleSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="52.857" height="52.857" viewBox="0 0 52.857 52.857" fill="none"><path d="M43.021 16.593C43.021 7.444 35.579 0 26.43 0 17.28 0 9.836 7.443 9.836 16.593c0 8.425 6.316 15.387 14.459 16.438v10.109h-4.213c-1.178 0-2.133.955-2.133 2.133s.955 2.133 2.133 2.133h4.213v3.318c0 1.178.955 2.133 2.135 2.133 1.177 0 2.132-.955 2.132-2.133v-3.318h4.213c1.181 0 2.136-.955 2.136-2.133s-.955-2.133-2.136-2.133h-4.213V33.031c8.252-1.052 14.567-8.013 14.567-16.438zM14.104 16.593c0-6.797 5.529-12.326 12.326-12.326 6.794 0 12.326 5.529 12.326 12.326 0 6.797-5.531 12.326-12.326 12.326-6.797 0-12.326-5.529-12.326-12.326z" fill="currentColor"/></svg>`;

const otherSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none"><path d="M219.998 23.956a12.003 12.003 0 00-.136-1.898 11.846 11.846 0 00-.52-1.858 11.322 11.322 0 00-.776-1.75 11.97 11.97 0 00-.967-1.567 11.698 11.698 0 00-1.249-1.552 12.086 12.086 0 00-1.563-1.25 11.63 11.63 0 00-1.566-.967 11.266 11.266 0 00-1.754-.776 12.066 12.066 0 00-1.851-.52A12.005 12.005 0 001208 12h-36a12 12 0 000 24h7.029l-15.051 15.051A71.975 71.975 0 10108 178.981V192H88a12 12 0 000 24h20v16a12 12 0 0024 0v-16h20a12 12 0 000-24h-20v-13.019A71.928 71.928 0 00180.278 68.693L196 52.971V60a12 12 0 0024 0V24a12.008 12.008 0 00-.002-.044zM120 156a48 48 0 1148-48 48.055 48.055 0 01-48 48z" fill="currentColor"/></svg>`;

export const MaleAssetIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = theme.Colors.textSecondary }) => (
  <SvgXml xml={createColoredXml(maleSvgXml, color)} width={size} height={size} />
);

export const FemaleAssetIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = theme.Colors.textSecondary }) => (
  <SvgXml xml={createColoredXml(femaleSvgXml, color)} width={size} height={size} />
);

export const OtherAssetIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = theme.Colors.textSecondary }) => (
  <SvgXml xml={createColoredXml(otherSvgXml, color)} width={size} height={size} />
);

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const Icons: React.FC<IconProps> = ({ name, size = 24, color = theme.Colors.text, style }) => {
  const iconPaths: { [key: string]: React.ReactElement } = {
    person: (
      <>
        <Circle cx="12" cy="7" r="4" />
        <Path d="M12 14s-4 0-8 4v2h16v-2c-4-4-8-4-8-4z" />
      </>
    ),
    email: (
      <>
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <Path d="M22 6l-10 7L2 6" />
      </>
    ),
    lock: (
      <>
        <Path d="M18 10h-1V7c0-2.76-2.24-5-5-5S7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v3z" />
      </>
    ),
    eye: (
      <>
        <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      </>
    ),
    'eye-off': (
      <>
        <Path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.17C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zm7.89 7.89l3.15 3.15c-.02-.01-.02-.01-.03-.02-.65.36-1.37.58-2.12.58-2.76 0-5-2.24-5-5 0-.75.22-1.47.58-2.12l3.15 3.15z" />
      </>
    ),
    calendar: (
      <>
        <Path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM5 7V6h14v1H5z" />
      </>
    ),
    phone: (
      <>
        <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.46.57 3.57.11.35.03.74-.25 1.02L6.62 10.79z" />
      </>
    ),
    check: (
      <>
        <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </>
    ),
    male: (
      <>
        {/* Mars symbol — circle + NE arrow */}
        <Circle cx="10" cy="10" r="4" stroke={color} strokeWidth="2" fill="none" />
        <Path
          d="M13 7L20 4"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M20 4v4M20 4h-4"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    
    female: (
      <>
        {/* Venus symbol — circle + cross */}
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" />
        <Path
          d="M12 12v8"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 17h6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    
    other: (
      <>
        {/* Neutral symbol — circle + short stem + small ring */}
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" />
        <Path
          d="M12 12v4"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx="12"
          cy="20"
          r="2"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
      </>
    ),
    
    
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {iconPaths[name]}
    </Svg>
  );
};

export default Icons;
