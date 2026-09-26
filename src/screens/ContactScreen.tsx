import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { ChevronLeftIcon, EmailIcon, PhoneIcon } from '../components/Icons';

const ContactScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleEmailPress = () => Linking.openURL('mailto:nititechnologies1@gmail.com?subject=Support Request');
  const handlePhonePress = () => Linking.openURL('tel:+919811862846');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeftIcon size={24} color={theme.Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            We're here to help! Get in touch with us through any of the following channels:
          </Text>

          <View style={styles.contactSection}>
            <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <EmailIcon size={24} color={theme.Colors.primary} />
              </View>
              <View style={styles.details}>
                <Text style={styles.title}>Email Support</Text>
                <Text style={styles.subtitle}>Get help via email</Text>
                <Text style={styles.value}>nititechnologies1@gmail.com</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} onPress={handlePhonePress} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <PhoneIcon size={24} color={theme.Colors.primary} />
              </View>
              <View style={styles.details}>
                <Text style={styles.title}>Phone Support</Text>
                <Text style={styles.subtitle}>Call us directly</Text>
                <Text style={styles.value}>+91 98118 62846</Text>
              </View>
            </TouchableOpacity>

          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Response Times</Text>
            <View style={styles.infoItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.infoText}>Email: Within 24 hours</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.infoText}>Phone: Monday - Friday, 9 AM - 6 PM EST</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.Spacing.lg,
    paddingTop: theme.Spacing.md,
  },
  description: {
    fontSize: theme.Typography.fontSize.base,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.xl,
    textAlign: 'center',
    fontFamily: theme.Typography.fontFamily.regular,
  },
  contactSection: {
    gap: theme.Spacing.md,
    marginBottom: theme.Spacing.xl,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.Spacing.md,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.xs / 2,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  subtitle: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textTertiary,
    marginBottom: theme.Spacing.xs / 2,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  value: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeight.medium,
    fontFamily: theme.Typography.fontFamily.medium,
  },
  infoBox: {
    marginTop: theme.Spacing.lg,
    backgroundColor: '#F8F9FA',
    padding: theme.Spacing.md,
    borderRadius: theme.BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  infoTitle: {
    fontSize: theme.Typography.fontSize.sm,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    marginBottom: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.Spacing.xs / 2,
  },
  bullet: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textTertiary,
    marginRight: theme.Spacing.xs,
    lineHeight: 20,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  infoText: {
    fontSize: theme.Typography.fontSize.sm,
    color: theme.Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
    fontFamily: theme.Typography.fontFamily.regular,
  },
});

export default ContactScreen;
