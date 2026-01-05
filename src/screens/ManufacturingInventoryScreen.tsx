import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  fetchRawMaterials,
  createRawMaterialAsync,
  updateRawMaterialAsync,
  deleteRawMaterialAsync,
  restockRawMaterialAsync,
  fetchSubRecipes,
  manufactureSubRecipeAsync,
} from '../store/slices/manufacturingSlice';
import { RawMaterial } from '../types/manufacturing';
import { useManufacturing } from '../hooks/useManufacturing';
import ATMInput from '../components/common/ATMInput';
import ConfirmationModal from '../components/common/ConfirmationModal';
import moment from 'moment-timezone';

const ManufacturingInventoryScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const dispatch = useDispatch<AppDispatch>();

  const { rawMaterials, subRecipes, intermediateProducts } = useSelector(
    (state: RootState) => state.manufacturing
  );
  const {
    checkRawMaterialsAvailable,
    intermediateProductsList,
    getSubRecipeAvailability,
  } = useManufacturing();

  const [activeTab, setActiveTab] = useState<'raw' | 'intermediate'>('raw');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isRestockModalVisible, setRestockModalVisible] = useState(false);
  const [isManufactureModalVisible, setManufactureModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [materialName, setMaterialName] = useState('');
  const [materialUnit, setMaterialUnit] = useState('');

  // Quantities & Costs
  const [materialQuantity, setMaterialQuantity] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [materialLowStock, setMaterialLowStock] = useState(0);
  const [restockAmount, setRestockAmount] = useState(0);

  const [manufactureQuantity, setManufactureQuantity] = useState('1');

  // Confirmation states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
  const [confirmColor, setConfirmColor] = useState<string | undefined>(undefined);

  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    unit?: string;
    quantity?: string;
    cost?: string;
    restock?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean;
    unit?: boolean;
    quantity?: boolean;
    cost?: boolean;
    restock?: boolean;
  }>({});

  // Load manufacturing data from API on mount
  useEffect(() => {
    dispatch(fetchRawMaterials());
    dispatch(fetchSubRecipes());
  }, [dispatch]);

  // --- Stats Logic ---
  const stats = useMemo(() => {
    const totalMaterials = rawMaterials.length;
    const lowStock = rawMaterials.filter(m => m.lowStockThreshold && m.quantity > 0 && m.quantity <= m.lowStockThreshold).length;
    const outOfStock = rawMaterials.filter(m => m.quantity <= 0).length;
    return { totalMaterials, lowStock, outOfStock };
  }, [rawMaterials]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchRawMaterials()).unwrap(),
        dispatch(fetchSubRecipes()).unwrap(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return rawMaterials;
    return rawMaterials.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawMaterials, searchQuery]);

  const filteredIntermediateProducts = useMemo(() => {
    if (!searchQuery) return intermediateProductsList;
    return intermediateProductsList.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [intermediateProductsList, searchQuery]);

  const resetForm = useCallback(() => {
    setMaterialName('');
    setMaterialUnit('');
    setMaterialQuantity(0);
    setMaterialCost(0);
    setMaterialLowStock(0);
    setEditingMaterial(null);
    setErrors({});
    setTouched({});
  }, []);

  // Validation function
  const validateMaterialForm = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!materialName.trim()) {
      newErrors.name = 'Material name is required';
    } else if (materialName.trim().length < 2) {
      newErrors.name = 'Material name is too short';
    }

    if (!materialUnit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (materialQuantity < 0) {
      newErrors.quantity = 'Quantity must be positive';
    }

    if (materialCost < 0) {
      newErrors.cost = 'Cost must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [materialName, materialUnit, materialQuantity, materialCost]);

  const openAddModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((material: RawMaterial) => {
    setEditingMaterial(material);
    setMaterialName(material.name);
    setMaterialUnit(material.unit);
    setMaterialQuantity(material.quantity);
    setMaterialCost(material.costPerUnit);
    setMaterialLowStock(material.lowStockThreshold || 0);
    setModalVisible(true);
  }, []);

  const openRestockModal = useCallback((material: RawMaterial) => {
    setSelectedMaterial(material);
    setRestockAmount(0);
    setRestockModalVisible(true);
  }, []);

  const openManufactureModal = useCallback((recipeId: string) => {
    setSelectedRecipe(recipeId);
    setManufactureQuantity('1');
    setManufactureModalVisible(true);
  }, []);

  const handleSaveMaterial = useCallback(async () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      unit: true,
      quantity: true,
      cost: true,
    });

    if (!validateMaterialForm()) {
      return;
    }

    const materialData = {
      name: materialName.trim(),
      unit: materialUnit.trim(),
      quantity: materialQuantity,
      costPerUnit: materialCost,
      lowStockThreshold: materialLowStock > 0 ? materialLowStock : undefined,
    };

    try {
      if (editingMaterial) {
        await dispatch(updateRawMaterialAsync({ id: editingMaterial.id, data: materialData })).unwrap();
      } else {
        await dispatch(createRawMaterialAsync(materialData)).unwrap();
      }
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to save material. Please check your connection.');
    }
  }, [
    dispatch,
    editingMaterial,
    materialName,
    materialUnit,
    materialQuantity,
    materialCost,
    materialLowStock,
    resetForm,
    validateMaterialForm,
  ]);

  const handleDeleteMaterial = useCallback((material: RawMaterial) => {
    setConfirmTitle('Confirm Delete');
    setConfirmMessage('Are you sure you want to delete this material? This action cannot be undone.');
    setConfirmColor(COLORS.error);
    setConfirmAction(() => async () => {
      try {
        await dispatch(deleteRawMaterialAsync(material.id)).unwrap();
        setConfirmVisible(false);
      } catch (error: any) {
        console.error(error);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  }, [dispatch, COLORS.error]);

  const handleRestock = useCallback(async () => {
    if (!selectedMaterial) return;
    const amount = restockAmount;
    if (amount <= 0) {
      return;
    }

    try {
      await dispatch(restockRawMaterialAsync({ id: selectedMaterial.id, amount })).unwrap();
      setRestockModalVisible(false);
      setSelectedMaterial(null);
      setRestockAmount(0);
    } catch (error: any) {
      console.error(error);
    }
  }, [dispatch, selectedMaterial, restockAmount]);

  const handleManufacture = useCallback(async () => {
    if (!selectedRecipe) return;
    const qty = parseInt(manufactureQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return;
    }

    if (!checkRawMaterialsAvailable(selectedRecipe, qty)) {
      Alert.alert('Insufficient Stock', 'You do not have enough raw materials to manufacture this quantity.');
      return;
    }

    try {
      await dispatch(manufactureSubRecipeAsync({ id: selectedRecipe, batches: qty })).unwrap();
      setManufactureModalVisible(false);
      setSelectedRecipe(null);
      setManufactureQuantity('1');
      Alert.alert('Success', 'Manufacturing complete. Inventory updated.');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to manufacture product. Please try again.');
    }
  }, [dispatch, selectedRecipe, manufactureQuantity, checkRawMaterialsAvailable]);

  const getStockStatus = (material: RawMaterial) => {
    if (material.lowStockThreshold) {
      if (material.quantity <= 0) return 'out';
      if (material.quantity <= material.lowStockThreshold) return 'low';
    }
    return 'ok';
  };

  const renderRawMaterialCard = (material: RawMaterial) => {
    const stockStatus = getStockStatus(material);

    return (
      <View
        key={material.id}
        style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.materialInfo}>
            <Text style={[styles.materialName, { color: COLORS.textPrimary }]}>{material.name}</Text>
            <Text style={[styles.materialUnit, { color: COLORS.textSecondary }]}>
              Unit: {material.unit}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.containerGray }]}
              onPress={() => openEditModal(material)}
            >
              <Icon name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.errorBg }]}
              onPress={() => handleDeleteMaterial(material)}
            >
              <Icon name="delete" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.stockSection, { borderTopColor: COLORS.borderLight }]}>
          <View style={styles.stockInfo}>
            <Text style={[styles.stockLabel, { color: COLORS.textSecondary }]}>
              Current Stock
            </Text>
            <View style={styles.stockValueRow}>
              <Text
                style={[
                  styles.stockValue,
                  { color: COLORS.textPrimary },
                  stockStatus === 'out' && { color: COLORS.error },
                  stockStatus === 'low' && { color: COLORS.warning },
                ]}
              >
                {material.quantity.toFixed(2)} {material.unit}
              </Text>
              {stockStatus !== 'ok' && (
                <View
                  style={[
                    styles.stockBadge,
                    stockStatus === 'out'
                      ? { backgroundColor: COLORS.errorBg }
                      : { backgroundColor: COLORS.warningBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.stockBadgeText,
                      { color: stockStatus === 'out' ? COLORS.error : COLORS.warning },
                    ]}
                  >
                    {stockStatus === 'out' ? 'Out of Stock' : 'Low Stock'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.costInfo}>
            <Text style={[styles.stockLabel, { color: COLORS.textSecondary }]}>
              Cost Per Unit
            </Text>
            <Text style={[styles.costValue, { color: COLORS.textPrimary }]}>
              ${material.costPerUnit.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.restockButton, { backgroundColor: COLORS.primary }]}
          onPress={() => openRestockModal(material)}
        >
          <Icon name="plus" size={18} color="#fff" />
          <Text style={styles.restockButtonText}>Restock</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderIntermediateProductCard = (product: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }) => {
    const recipe = subRecipes.find(r => r.id === product.id);
    const canManufacture = recipe ? checkRawMaterialsAvailable(recipe.id, 1) : false;
    const availability = recipe ? getSubRecipeAvailability(recipe.id, 1) : [];

    return (
      <View
        key={product.id}
        style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.materialInfo}>
            <Text style={[styles.materialName, { color: COLORS.textPrimary }]}>{product.name}</Text>
            <Text style={[styles.materialUnit, { color: COLORS.textSecondary }]}>
              Prepared Item
            </Text>
          </View>
        </View>

        <View style={[styles.stockSection, { borderTopColor: COLORS.borderLight }]}>
          <View style={styles.stockInfo}>
            <Text style={[styles.stockLabel, { color: COLORS.textSecondary }]}>
              In Stock
            </Text>
            <Text
              style={[
                styles.stockValue,
                { color: COLORS.textPrimary },
                product.quantity <= 0 && { color: COLORS.error },
              ]}
            >
              {product.quantity.toFixed(2)} {product.unit}
            </Text>
          </View>

          {recipe && (
            <View style={styles.recipeInfo}>
              <Text style={[styles.stockLabel, { color: COLORS.textSecondary }]}>
                Yields
              </Text>
              <Text style={[styles.yieldValue, { color: COLORS.textPrimary }]}>
                {recipe.yield} {recipe.yieldUnit}
              </Text>
            </View>
          )}
        </View>

        {recipe && (
          <View style={[styles.ingredientsPreview, { borderTopColor: COLORS.borderLight, backgroundColor: COLORS.background }]}>
            <Text style={[styles.ingredientsLabel, { color: COLORS.textSecondary }]}>
              Required Ingredients:
            </Text>
            {availability.map((ing, index) => (
              <View key={index} style={styles.ingredientPreviewRow}>
                <Text style={[styles.ingredientPreviewName, { color: COLORS.textPrimary }]}>
                  {ing.ingredientName}
                </Text>
                <Text
                  style={[
                    styles.ingredientPreviewQty,
                    { color: ing.shortage > 0 ? COLORS.error : COLORS.textSecondary },
                  ]}
                >
                  {ing.available.toFixed(1)} / {ing.required.toFixed(1)}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.manufactureButton,
                { backgroundColor: canManufacture ? COLORS.primary : COLORS.border },
              ]}
              onPress={() => recipe && openManufactureModal(recipe.id)}
              disabled={!canManufacture}
            >
              <Icon name="tools" size={18} color={canManufacture ? '#fff' : COLORS.textSecondary} />
              <Text
                style={[
                  styles.manufactureButtonText,
                  { color: canManufacture ? '#fff' : COLORS.textSecondary },
                ]}
              >
                Manufacture
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTagline}>INVENTORY MANAGEMENT</Text>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Raw Materials</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={openAddModal}
          >
            <Icon name="plus" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.totalMaterials}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Materials</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.lowStock}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Low Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.error }]}>
              {stats.outOfStock}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Out of Stock</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: COLORS.white }]}>
        <Icon name="magnify" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: COLORS.textPrimary }]}
          placeholder="Search materials..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: COLORS.containerGray },
            activeTab === 'raw' && [styles.activeTab, { backgroundColor: COLORS.primary }],
          ]}
          onPress={() => setActiveTab('raw')}
        >
          <Icon
            name="package-variant"
            size={18}
            color={activeTab === 'raw' ? '#fff' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'raw' ? '#fff' : COLORS.textSecondary },
            ]}
          >
            Raw Materials ({rawMaterials.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: COLORS.containerGray },
            activeTab === 'intermediate' && [styles.activeTab, { backgroundColor: COLORS.primary }],
          ]}
          onPress={() => setActiveTab('intermediate')}
        >
          <Icon
            name="layers-outline"
            size={18}
            color={activeTab === 'intermediate' ? '#fff' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'intermediate' ? '#fff' : COLORS.textSecondary },
            ]}
          >
            Prepared ({intermediateProductsList.length})
          </Text>
        </TouchableOpacity>
      </View>



      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.gridContainer}>
          {activeTab === 'raw' ? (
            filteredMaterials.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="package-variant-closed" size={48} color={COLORS.textTertiary} />
                <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
                  No Raw Materials
                </Text>
                <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                  Add raw materials to track inventory
                </Text>
              </View>
            ) : (
              filteredMaterials.map(material => renderRawMaterialCard(material))
            )
          ) : filteredIntermediateProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="layers-off" size={48} color={COLORS.textTertiary} />
              <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
                No Prepared Items
              </Text>
              <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                Create sub-recipes in Recipe Management
              </Text>
            </View>
          ) : (
            filteredIntermediateProducts.map(product => renderIntermediateProductCard(product))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingWrapper}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
            <View style={[styles.modalContent, { backgroundColor: COLORS.white }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                  {editingMaterial ? 'Edit Raw Material' : 'Add Raw Material'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>
                  Material Name *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: COLORS.background, color: COLORS.textPrimary },
                    touched.name && errors.name && styles.inputError,
                  ]}
                  value={materialName}
                  onChangeText={setMaterialName}
                  placeholder="e.g., Flour, Sugar"
                  placeholderTextColor={COLORS.textTertiary}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>
                      Unit *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: COLORS.background, color: COLORS.textPrimary },
                        touched.unit && errors.unit && styles.inputError,
                      ]}
                      value={materialUnit}
                      onChangeText={setMaterialUnit}
                      placeholder="kg, L, pcs"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                  </View>
                </View>

                <View style={[styles.row, { marginTop: 10 }]}>
                  <View style={styles.halfInput}>
                    <ATMInput
                      label="Initial Qty"
                      value={materialQuantity}
                      onChange={setMaterialQuantity}
                      currency={materialUnit || 'Units'}
                      placeholder="0.00"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <ATMInput
                      label="Cost"
                      value={materialCost}
                      onChange={setMaterialCost}
                      currency="JOD"
                      placeholder="0.00"
                    />
                  </View>
                </View>

                <View style={[styles.row, { marginTop: -12 }]}>
                  <View style={styles.halfInput}>
                    <ATMInput
                      label="Low Stock Threshold"
                      value={materialLowStock}
                      onChange={setMaterialLowStock}
                      currency={materialUnit || 'Units'}
                      placeholder="0.00"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: COLORS.borderLight }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: COLORS.borderLight }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: COLORS.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleSaveMaterial}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Restock Modal */}
      <Modal visible={isRestockModalVisible} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingWrapper}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.backdrop} onPress={() => setRestockModalVisible(false)} />
            <View style={[styles.modalContent, { backgroundColor: COLORS.white }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                  Restock {selectedMaterial?.name}
                </Text>
                <TouchableOpacity onPress={() => setRestockModalVisible(false)}>
                  <Icon name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <ATMInput
                  label={`Amount to Add (${selectedMaterial?.unit})`}
                  value={restockAmount}
                  onChange={setRestockAmount}
                  currency={selectedMaterial?.unit || 'Units'}
                  placeholder="0.00"
                />
              </View>

              <View style={[styles.modalFooter, { borderTopColor: COLORS.borderLight }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: COLORS.borderLight }]}
                  onPress={() => setRestockModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: COLORS.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleRestock}
                >
                  <Text style={styles.saveButtonText}>Restock</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Manufacture Modal */}
      <Modal visible={isManufactureModalVisible} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingWrapper}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.backdrop} onPress={() => setManufactureModalVisible(false)} />
            <View style={[styles.modalContent, { backgroundColor: COLORS.white }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                  Manufacture Product
                </Text>
                <TouchableOpacity onPress={() => setManufactureModalVisible(false)}>
                  <Icon name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <ATMInput
                  label="Batches to Produce"
                  value={parseFloat(manufactureQuantity) || 0}
                  onChange={(val) => setManufactureQuantity(val.toString())}
                  currency="Qty"
                  placeholder="1.00"
                />
              </View>

              <View style={[styles.modalFooter, { borderTopColor: COLORS.borderLight }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: COLORS.borderLight }]}
                  onPress={() => setManufactureModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: COLORS.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleManufacture}
                >
                  <Text style={styles.saveButtonText}>Manufacture</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmationModal
        isVisible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={confirmAction}
        onCancel={() => setConfirmVisible(false)}
        confirmColor={confirmColor}
      />
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
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
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 24, backgroundColor: colors.borderLight },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    // Active styling handled inline
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  materialUnit: {
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockSection: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 24,
  },
  stockInfo: {
    flex: 1,
  },
  costInfo: {
    alignItems: 'flex-end',
  },
  recipeInfo: {
    alignItems: 'flex-end',
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stockValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  yieldValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    marginTop: 0,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  restockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientsPreview: {
    padding: 12,
    borderTopWidth: 1,
  },
  ingredientsLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  ingredientPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ingredientPreviewName: {
    fontSize: 13,
    fontWeight: '500',
  },
  ingredientPreviewQty: {
    fontSize: 13,
    fontWeight: '600',
  },
  manufactureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  manufactureButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidingWrapper: {
    flex: 1,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManufacturingInventoryScreen;
