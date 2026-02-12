import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import { attributesService, Attribute, SubAttribute, CreateAttributeDto, CreateSubAttributeDto } from '../services/attributesService';

type InputType = 'SINGLE_SELECT' | 'MULTI_SELECT';

interface AttributeFormData {
  name: string;
  inputType: InputType;
  isRequired: boolean;
}

interface SubAttributeFormData {
  name: string;
  price: string;
  isAvailable: boolean;
}

const AttributesScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  // State
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal states
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [showSubAttributeModal, setShowSubAttributeModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [editingSubAttribute, setEditingSubAttribute] = useState<SubAttribute | null>(null);
  const [parentAttributeId, setParentAttributeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [attributeForm, setAttributeForm] = useState<AttributeFormData>({
    name: '',
    inputType: 'SINGLE_SELECT',
    isRequired: false,
  });
  const [subAttributeForm, setSubAttributeForm] = useState<SubAttributeFormData>({
    name: '',
    price: '0',
    isAvailable: true,
  });

  // Animation for expanded items
  const [expandedAnimations] = useState<{ [key: string]: Animated.Value }>({});

  const loadData = async () => {
    try {
      const data = await attributesService.getAll();
      // Sort by newest first
      const sorted = data.sort((a, b) => b.id.localeCompare(a.id));
      setAttributes(sorted);
    } catch (error) {
      console.error('Failed to load attributes:', error);
      Alert.alert('Error', 'Failed to load attributes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtering
  const filteredAttributes = attributes.filter((attr) =>
    attr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalAttributes: attributes.length,
    totalSubAttributes: attributes.reduce(
      (sum, attr) => sum + (attr.subAttributes?.length || 0),
      0
    ),
    requiredCount: attributes.filter((attr) => attr.isRequired).length,
  };

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Open attribute modal
  const openAttributeModal = (attribute?: Attribute) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setAttributeForm({
        name: attribute.name,
        inputType: attribute.inputType,
        isRequired: attribute.isRequired,
      });
    } else {
      setEditingAttribute(null);
      setAttributeForm({
        name: '',
        inputType: 'SINGLE_SELECT',
        isRequired: false,
      });
    }
    setShowAttributeModal(true);
  };

  // Open sub-attribute modal
  const openSubAttributeModal = (attributeId: string, subAttribute?: SubAttribute) => {
    setParentAttributeId(attributeId);
    if (subAttribute) {
      setEditingSubAttribute(subAttribute);
      setSubAttributeForm({
        name: subAttribute.name,
        price: String(subAttribute.price || 0),
        isAvailable: subAttribute.isAvailable,
      });
    } else {
      setEditingSubAttribute(null);
      setSubAttributeForm({
        name: '',
        price: '0',
        isAvailable: true,
      });
    }
    setShowSubAttributeModal(true);
  };

  // Save attribute
  const handleSaveAttribute = async () => {
    if (!attributeForm.name.trim()) {
      Alert.alert('Error', 'Please enter an attribute name.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAttribute) {
        await attributesService.update(editingAttribute.id, {
          name: attributeForm.name,
          inputType: attributeForm.inputType,
          isRequired: attributeForm.isRequired,
        });
      } else {
        await attributesService.create({
          name: attributeForm.name,
          inputType: attributeForm.inputType,
          isRequired: attributeForm.isRequired,
        });
      }
      await loadData();
      setShowAttributeModal(false);
    } catch (error) {
      console.error('Failed to save attribute:', error);
      Alert.alert('Error', 'Failed to save attribute. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete attribute
  const handleDeleteAttribute = async (id: string) => {
    const attr = attributes.find((a) => a.id === id);
    if (attr && attr.subAttributes && attr.subAttributes.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `This attribute has ${attr.subAttributes.length} sub-attribute(s). Please delete them first.`
      );
      return;
    }

    Alert.alert('Delete Attribute', 'Are you sure you want to delete this attribute?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await attributesService.delete(id);
            await loadData();
          } catch (error) {
            console.error('Failed to delete attribute:', error);
            Alert.alert('Error', 'Failed to delete attribute.');
          }
        },
      },
    ]);
  };

  // Save sub-attribute
  const handleSaveSubAttribute = async () => {
    if (!subAttributeForm.name.trim()) {
      Alert.alert('Error', 'Please enter a sub-attribute name.');
      return;
    }

    if (!parentAttributeId) return;

    setIsSaving(true);
    try {
      const price = parseFloat(subAttributeForm.price) || 0;

      if (editingSubAttribute) {
        await attributesService.updateSubAttribute(editingSubAttribute.id, {
          name: subAttributeForm.name,
          price,
          isAvailable: subAttributeForm.isAvailable,
        });
      } else {
        await attributesService.createSubAttribute(parentAttributeId, {
          name: subAttributeForm.name,
          price,
          isAvailable: subAttributeForm.isAvailable,
        });
      }
      await loadData();
      setShowSubAttributeModal(false);
    } catch (error) {
      console.error('Failed to save sub-attribute:', error);
      Alert.alert('Error', 'Failed to save sub-attribute. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete sub-attribute
  const handleDeleteSubAttribute = async (subAttrId: string) => {
    Alert.alert('Delete Sub-Attribute', 'Are you sure you want to delete this sub-attribute?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await attributesService.deleteSubAttribute(subAttrId);
            await loadData();
          } catch (error) {
            console.error('Failed to delete sub-attribute:', error);
            Alert.alert('Error', 'Failed to delete sub-attribute.');
          }
        },
      },
    ]);
  };

  // Render sub-attribute card
  const renderSubAttributeCard = (subAttr: SubAttribute, attributeId: string) => (
    <View key={subAttr.id} style={styles.subAttributeCard}>
      <View style={styles.subAttributeInfo}>
        <View style={styles.subAttributeHeader}>
          <Text style={[styles.subAttributeName, { color: COLORS.textPrimary }]}>{subAttr.name}</Text>
          <View
            style={[
              styles.availabilityBadge,
              { backgroundColor: subAttr.isAvailable ? COLORS.successBg : COLORS.errorBg },
            ]}
          >
            <Text
              style={[
                styles.availabilityText,
                { color: subAttr.isAvailable ? COLORS.success : COLORS.error },
              ]}
            >
              {subAttr.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
        {Number(subAttr.price) > 0 && (
          <Text style={[styles.subAttributePrice, { color: COLORS.primary }]}>
            +{Number(subAttr.price).toFixed(2)} JOD
          </Text>
        )}
      </View>
      <View style={styles.subAttributeActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => openSubAttributeModal(attributeId, subAttr)}
        >
          <Icon name="pencil-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDeleteSubAttribute(subAttr.id)}
        >
          <Icon name="delete-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render attribute card
  const renderAttributeCard = (attribute: Attribute) => {
    const isExpanded = expandedId === attribute.id;
    const subCount = attribute.subAttributes?.length || 0;

    return (
      <View key={attribute.id} style={styles.attributeCard}>
        {/* Header */}
        <TouchableOpacity
          style={styles.attributeHeader}
          onPress={() => toggleExpand(attribute.id)}
          activeOpacity={0.7}
        >
          <View style={styles.attributeMainInfo}>
            <View style={styles.attributeTitleRow}>
              <Text style={[styles.attributeName, { color: COLORS.textPrimary }]}>
                {attribute.name}
              </Text>
              {attribute.isRequired && (
                <View style={[styles.requiredBadge, { backgroundColor: COLORS.primary + '20' }]}>
                  <Text style={[styles.requiredText, { color: COLORS.primary }]}>Required</Text>
                </View>
              )}
            </View>
            <View style={styles.attributeMeta}>
              <View style={[styles.typeBadge, { backgroundColor: COLORS.containerGray }]}>
                <Icon
                  name={attribute.inputType === 'SINGLE_SELECT' ? 'radiobox-marked' : 'checkbox-marked-outline'}
                  size={12}
                  color={COLORS.textSecondary}
                />
                <Text style={[styles.typeText, { color: COLORS.textSecondary }]}>
                  {attribute.inputType === 'SINGLE_SELECT' ? 'Single' : 'Multi'}
                </Text>
              </View>
              <Text style={[styles.subCount, { color: COLORS.textTertiary }]}>
                {subCount} option{subCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.attributeActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openAttributeModal(attribute)}
            >
              <Icon name="pencil-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDeleteAttribute(attribute.id)}
            >
              <Icon name="delete-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={COLORS.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.subAttributesHeader}>
              <Text style={[styles.subAttributesTitle, { color: COLORS.textSecondary }]}>
                Options ({subCount})
              </Text>
              <TouchableOpacity
                style={[styles.addSubButton, { backgroundColor: COLORS.primary }]}
                onPress={() => openSubAttributeModal(attribute.id)}
              >
                <Icon name="plus" size={16} color="#FFF" />
                <Text style={styles.addSubButtonText}>Add Option</Text>
              </TouchableOpacity>
            </View>

            {attribute.subAttributes && attribute.subAttributes.length > 0 ? (
              <View style={styles.subAttributesList}>
                {attribute.subAttributes.map((sub) => renderSubAttributeCard(sub, attribute.id))}
              </View>
            ) : (
              <View style={styles.emptySubAttributes}>
                <Icon name="playlist-plus" size={32} color={COLORS.textTertiary} />
                <Text style={[styles.emptySubText, { color: COLORS.textTertiary }]}>
                  No options yet. Add your first option above.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTagline}>PRODUCT CUSTOMIZATION</Text>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>
              Add-ons & Attributes
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={() => openAttributeModal()}
          >
            <Icon name="plus" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.totalAttributes}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Attributes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.totalSubAttributes}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Options</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.requiredCount}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Required</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight }]}>
          <Icon name="magnify" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: COLORS.textPrimary }]}
            placeholder="Search attributes..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {filteredAttributes.length > 0 ? (
            filteredAttributes.map(renderAttributeCard)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="tag-multiple-outline" size={64} color={COLORS.textTertiary} />
              <Text style={[styles.emptyTitle, { color: COLORS.textSecondary }]}>
                No Attributes Found
              </Text>
              <Text style={[styles.emptyText, { color: COLORS.textTertiary }]}>
                Create attributes to add customization options to your products.
              </Text>
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Attribute Modal */}
      <Modal visible={showAttributeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                {editingAttribute ? 'Edit Attribute' : 'New Attribute'}
              </Text>
              <TouchableOpacity onPress={() => setShowAttributeModal(false)}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderColor: COLORS.borderLight }]}
                  value={attributeForm.name}
                  onChangeText={(text) => setAttributeForm({ ...attributeForm, name: text })}
                  placeholder="e.g., Size, Color, Extras"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>

              {/* Input Type */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Selection Type</Text>
                <View style={styles.typeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      { borderColor: COLORS.borderLight },
                      attributeForm.inputType === 'SINGLE_SELECT' && {
                        borderColor: COLORS.primary,
                        backgroundColor: COLORS.primary + '10',
                      },
                    ]}
                    onPress={() => setAttributeForm({ ...attributeForm, inputType: 'SINGLE_SELECT' })}
                  >
                    <Icon
                      name="radiobox-marked"
                      size={20}
                      color={attributeForm.inputType === 'SINGLE_SELECT' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        { color: attributeForm.inputType === 'SINGLE_SELECT' ? COLORS.primary : COLORS.textSecondary },
                      ]}
                    >
                      Single Select
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      { borderColor: COLORS.borderLight },
                      attributeForm.inputType === 'MULTI_SELECT' && {
                        borderColor: COLORS.primary,
                        backgroundColor: COLORS.primary + '10',
                      },
                    ]}
                    onPress={() => setAttributeForm({ ...attributeForm, inputType: 'MULTI_SELECT' })}
                  >
                    <Icon
                      name="checkbox-marked-outline"
                      size={20}
                      color={attributeForm.inputType === 'MULTI_SELECT' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        { color: attributeForm.inputType === 'MULTI_SELECT' ? COLORS.primary : COLORS.textSecondary },
                      ]}
                    >
                      Multi Select
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Required */}
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={[styles.label, { color: COLORS.textSecondary, marginBottom: 0 }]}>Required</Text>
                    <Text style={[styles.switchHint, { color: COLORS.textTertiary }]}>
                      Customer must select an option
                    </Text>
                  </View>
                  <Switch
                    value={attributeForm.isRequired}
                    onValueChange={(value) => setAttributeForm({ ...attributeForm, isRequired: value })}
                    trackColor={{ false: COLORS.borderLight, true: COLORS.primary + '50' }}
                    thumbColor={attributeForm.isRequired ? COLORS.primary : COLORS.textTertiary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: COLORS.borderLight }]}
                onPress={() => setShowAttributeModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: COLORS.primary }]}
                onPress={handleSaveAttribute}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{editingAttribute ? 'Update' : 'Create'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sub-Attribute Modal */}
      <Modal visible={showSubAttributeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                {editingSubAttribute ? 'Edit Option' : 'New Option'}
              </Text>
              <TouchableOpacity onPress={() => setShowSubAttributeModal(false)}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderColor: COLORS.borderLight }]}
                  value={subAttributeForm.name}
                  onChangeText={(text) => setSubAttributeForm({ ...subAttributeForm, name: text })}
                  placeholder="e.g., Small, Medium, Large"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>

              {/* Price */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Additional Price (JOD)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderColor: COLORS.borderLight }]}
                  value={subAttributeForm.price}
                  onChangeText={(text) => setSubAttributeForm({ ...subAttributeForm, price: text })}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Available */}
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={[styles.label, { color: COLORS.textSecondary, marginBottom: 0 }]}>Available</Text>
                    <Text style={[styles.switchHint, { color: COLORS.textTertiary }]}>
                      Option can be selected by customers
                    </Text>
                  </View>
                  <Switch
                    value={subAttributeForm.isAvailable}
                    onValueChange={(value) => setSubAttributeForm({ ...subAttributeForm, isAvailable: value })}
                    trackColor={{ false: COLORS.borderLight, true: COLORS.primary + '50' }}
                    thumbColor={subAttributeForm.isAvailable ? COLORS.primary : COLORS.textTertiary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: COLORS.borderLight }]}
                onPress={() => setShowSubAttributeModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: COLORS.primary }]}
                onPress={handleSaveSubAttribute}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{editingSubAttribute ? 'Update' : 'Create'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 20,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTagline: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.5,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    headerTitle: { fontSize: 26, fontWeight: '800' },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 6,
    },
    addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingTop: 8,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    statDivider: { width: 1, height: 28, backgroundColor: colors.borderLight },
    searchContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      fontWeight: '500',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    attributeCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden',
    },
    attributeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    attributeMainInfo: {
      flex: 1,
    },
    attributeTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    attributeName: {
      fontSize: 17,
      fontWeight: '700',
    },
    requiredBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    requiredText: {
      fontSize: 10,
      fontWeight: '700',
    },
    attributeMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    typeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    subCount: {
      fontSize: 12,
      fontWeight: '500',
    },
    attributeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    iconButton: {
      padding: 8,
    },
    expandedContent: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      padding: 16,
      backgroundColor: colors.background,
    },
    subAttributesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    subAttributesTitle: {
      fontSize: 13,
      fontWeight: '600',
    },
    addSubButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    addSubButtonText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
    subAttributesList: {
      gap: 8,
    },
    subAttributeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.white,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    subAttributeInfo: {
      flex: 1,
    },
    subAttributeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    subAttributeName: {
      fontSize: 15,
      fontWeight: '600',
    },
    availabilityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    availabilityText: {
      fontSize: 10,
      fontWeight: '600',
    },
    subAttributePrice: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 4,
    },
    subAttributeActions: {
      flexDirection: 'row',
      gap: 4,
    },
    emptySubAttributes: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptySubText: {
      marginTop: 8,
      fontSize: 13,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 80,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '700',
    },
    emptyText: {
      marginTop: 8,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      borderRadius: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
    },
    modalBody: {
      padding: 20,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 14,
      fontSize: 15,
    },
    typeOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    typeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1.5,
    },
    typeOptionText: {
      fontSize: 13,
      fontWeight: '600',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchHint: {
      fontSize: 12,
      marginTop: 2,
    },
    modalButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      borderWidth: 1,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    saveButton: {},
    saveButtonText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });

export default AttributesScreen;
