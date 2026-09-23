/**
 * Main App Component
 * Entry point for the React Native application
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const statusBarBgColor = isDarkMode ? "#1F2937" : "#FFFFFF";
  const safeAreaTopBgColor = isDarkMode ? "#000000" : "#FFFFFF";

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: safeAreaTopBgColor }} edges={['top', 'left', 'right']}>
          <StatusBar 
            barStyle={isDarkMode ? "light-content" : "dark-content"}
            backgroundColor={statusBarBgColor}
            translucent={false}
          />
          <AppNavigator />
        </SafeAreaView>
        <SafeAreaView style={{ backgroundColor: '#000000' }} edges={['bottom']} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
