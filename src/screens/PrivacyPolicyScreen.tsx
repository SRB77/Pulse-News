/**
 * Privacy Policy Screen Component
 * Screen displaying privacy policy content
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { ChevronLeftIcon } from '../components/Icons';

// Injected CSS styles for better appearance
const injectedStyles = `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #ffffff;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1F2937;
        color: #F9FAFB;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #FFFFFF;
      }
      .contact-info, .info-box, blockquote {
        background-color: #374151;
        color: #F9FAFB;
      }
    }
    h1 {
      font-size: 28px;
      margin-bottom: 10px;
      margin-top: 20px;
      color: #111827;
      font-weight: bold;
    }
    h2 {
      font-size: 20px;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #111827;
      font-weight: bold;
    }
    h3, h4, h5, h6 {
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #111827;
    }
    p {
      margin-bottom: 15px;
      color: #6B7280;
      line-height: 1.6;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 8px;
      color: #6B7280;
      line-height: 1.6;
    }
    a {
      color: #3B82F6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .contact-info, .info-box {
      background-color: #F8F9FA;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      color: #374151;
      line-height: 1.8;
    }
    .contact-info strong, .info-box strong {
      color: #111827;
    }
    blockquote {
      border-left: 4px solid #3B82F6;
      padding-left: 15px;
      margin: 15px 0;
      background-color: #F8F9FA;
      padding: 15px;
      border-radius: 4px;
    }
    code {
      background-color: #F3F4F6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background-color: #F3F4F6;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 15px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    th {
      background-color: #F9FAFB;
      font-weight: bold;
      color: #111827;
    }
  </style>
`;

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [loading, setLoading] = React.useState(true);
  
  // Get URL from route params, or use default
  const url = (route.params as any)?.url || 'https://pulse-admin-panel-liard.vercel.app/privacy-policy';
  
  // Create injected JavaScript for styling
  const injectedJS = `
    (function() {
      var style = document.createElement('style');
      style.innerHTML = ${JSON.stringify(injectedStyles.replace(/<style>|<\/style>/g, '').trim())};
      document.head.appendChild(style);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={24} color={theme.Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* WebView Content */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      )}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        injectedJavaScript={injectedJS}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: theme.Spacing.xs,
  },
  headerTitleWrapper: {
    flex: 1,
    marginHorizontal: theme.Spacing.md,
  },
  headerTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.background,
  },
});

export default PrivacyPolicyScreen;
