/**
 * Preferences Modal Component
 * Modal for editing user preferences including interests, area tags, and news categories
 * Updated to support initial preferences
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Chip from '../components/Chip';
import { theme } from '../constants/theme';
import { firebaseService } from '../services/firebaseService';

interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (preferences: {
    interests: string[];
  }) => void;
  initialPreferences?: {
    interests?: string[];
  };
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  initialPreferences 
}) => {
  const [interests, setInterests] = useState<string[]>(
    initialPreferences?.interests || []
  );
  const [interestOptions, setInterestOptions] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);

  // Fetch tags from Firebase
  const fetchTagsFromFirebase = useCallback(async () => {
    setLoadingTags(true);
    try {
      const result = await firebaseService.fetchTags();
      if (result.success && result.tags) {
        setInterestOptions(result.tags);
      } else {
        console.error('Error fetching tags:', result.error);
        // Fallback to empty array if fetch fails
        setInterestOptions([]);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setInterestOptions([]);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  // Fetch tags from Firebase when modal opens
  useEffect(() => {
    if (visible) {
      fetchTagsFromFirebase();
    }
  }, [visible, fetchTagsFromFirebase]);

  // Update preferences when modal opens or initialPreferences change
  useEffect(() => {
    if (visible && initialPreferences) {
      setInterests(initialPreferences.interests || []);
    }
  }, [visible, initialPreferences]);

  // Helper function to capitalize tag for display (backend stays lowercase)
  const capitalizeTag = (tag: string): string => {
    return tag
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(selected => selected !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSave = () => {
    onSave({
      interests: interests,
    });
    onClose();
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Preferences</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={styles.contentContainer}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Interests Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <Text style={styles.sectionSubtitle}>Select topics you're interested in</Text>
                {loadingTags ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.Colors.primary} />
                    <Text style={styles.loadingText}>Loading tags...</Text>
                  </View>
                ) : interestOptions.length > 0 ? (
                  <View style={styles.chipsContainer}>
                    {interestOptions.map((interest) => (
                      <Chip
                        key={interest}
                        label={capitalizeTag(interest)}
                        selected={interests.includes(interest)}
                        onPress={() => toggleInterest(interest)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tags available</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.BorderRadius.lg,
    borderTopRightRadius: theme.BorderRadius.lg,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: theme.Typography.fontSize.lg,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  modalCloseButton: {
    padding: theme.Spacing.sm,
  },
  modalCloseText: {
    fontSize: theme.Typography.fontSize.lg,
    color: '#666666',
    fontFamily: theme.Typography.fontFamily.regular,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
  },
  section: {
    paddingVertical: theme.Spacing.lg,
    paddingHorizontal: theme.Spacing.md,
  },
  sectionTitle: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: '#000000',
    marginBottom: theme.Spacing.xs,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  sectionSubtitle: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#666666',
    marginBottom: theme.Spacing.md,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: theme.Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.lg,
    borderRadius: theme.BorderRadius.full,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.Colors.borderLight,
  },
  saveButton: {
    backgroundColor: theme.Colors.primary,
  },
  cancelButtonText: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.text,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  saveButtonText: {
    fontSize: theme.Typography.fontSize.base,
    fontWeight: theme.Typography.fontWeight.semiBold,
    color: theme.Colors.backgroundSecondary,
    fontFamily: theme.Typography.fontFamily.semiBold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.xl,
  },
  loadingText: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#666666',
    marginTop: theme.Spacing.sm,
    fontFamily: theme.Typography.fontFamily.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.xl,
  },
  emptyText: {
    fontSize: theme.Typography.fontSize.sm,
    color: '#666666',
    fontFamily: theme.Typography.fontFamily.regular,
  },
});

export default PreferencesModal;
