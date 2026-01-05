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
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  fetchRawMaterials,
  fetchSubRecipes,
  fetchFinalRecipes,
  createSubRecipeAsync,
  updateSubRecipeAsync,
  deleteSubRecipeAsync,
  createFinalRecipeAsync,
  updateFinalRecipeAsync,
  deleteFinalRecipeAsync,
} from '../store/slices/manufacturingSlice';
import {
  SubRecipe,
  FinalRecipe,
  RecipeIngredient,
} from '../types/manufacturing';
import { itemsService, Item } from '../services/itemsService';
import ATMInput from '../components/common/ATMInput';
import ConfirmationModal from '../components/common/ConfirmationModal';

const RecipeManagementScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const dispatch = useDispatch<AppDispatch>();

  const { rawMaterials, subRecipes, finalRecipes } = useSelector(
    (state: RootState) => state.manufacturing
  );

  // Local state for menu items
  const [menuItems, setMenuItems] = useState<Item[]>([]);

  const [activeTab, setActiveTab] = useState<'sub' | 'final'>('final');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<SubRecipe | FinalRecipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Form state for sub-recipe
  const [subRecipeName, setSubRecipeName] = useState('');
  const [subRecipeYield, setSubRecipeYield] = useState(1);

  const [subRecipeYieldUnit, setSubRecipeYieldUnit] = useState('units');
  const [subRecipeIngredients, setSubRecipeIngredients] = useState<RecipeIngredient[]>([]);

  // Form state for final recipe
  const [selectedMenuItem, setSelectedMenuItem] = useState<Item | null>(null);
  const [finalRecipeIngredients, setFinalRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [showMenuItemPicker, setShowMenuItemPicker] = useState(false);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);

  // Confirmation states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
  const [confirmColor, setConfirmColor] = useState<string | undefined>(undefined);

  // Validation state
  const [errors, setErrors] = useState<{
    recipeName?: string;
    yield?: string;
    yieldUnit?: string;
    menuItem?: string;
    ingredients?: string;
  }>({});
  const [touched, setTouched] = useState<{
    recipeName?: boolean;
    yield?: boolean;
    yieldUnit?: boolean;
    menuItem?: boolean;
    ingredients?: boolean;
  }>({});

  // Load manufacturing data from API on mount
  useEffect(() => {
    dispatch(fetchRawMaterials());
    dispatch(fetchSubRecipes());
    dispatch(fetchFinalRecipes());
    loadMenuItems();
  }, [dispatch]);



  const loadMenuItems = async () => {
    try {
      const items = await itemsService.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchRawMaterials()).unwrap(),
        dispatch(fetchSubRecipes()).unwrap(),
        dispatch(fetchFinalRecipes()).unwrap(),
        loadMenuItems(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Filter recipes based on search
  const filteredSubRecipes = useMemo(() => {
    if (!searchQuery) return subRecipes;
    return subRecipes.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subRecipes, searchQuery]);

  const filteredFinalRecipes = useMemo(() => {
    if (!searchQuery) return finalRecipes;
    return finalRecipes.filter(r =>
      r.menuItemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [finalRecipes, searchQuery]);

  // Menu items without recipes
  const menuItemsWithoutRecipe = useMemo(() => {
    const recipeMenuIds = finalRecipes.map(r => r.menuItemId);
    return menuItems.filter(item => !recipeMenuIds.includes(item.id));
  }, [menuItems, finalRecipes]);

  // --- Stats Logic ---
  const stats = useMemo(() => {
    return {
      finalCount: finalRecipes.length,
      subCount: subRecipes.length,
      missingCount: menuItemsWithoutRecipe.length,
    };
  }, [finalRecipes, subRecipes, menuItemsWithoutRecipe]);

  const resetForm = useCallback(() => {
    setSubRecipeName('');
    setSubRecipeYield(1);
    setSubRecipeYieldUnit('units');
    setSubRecipeIngredients([]);
    setSelectedMenuItem(null);
    setFinalRecipeIngredients([]);
    setEditingRecipe(null);
    setErrors({});
    setTouched({});
  }, []);

  // Validation functions
  const validateSubRecipeForm = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!subRecipeName.trim()) {
      newErrors.recipeName = 'Recipe name is required';
    } else if (subRecipeName.trim().length < 2) {
      newErrors.recipeName = 'Recipe name too short';
    }

    if (subRecipeYield <= 0) {
      newErrors.yield = 'Yield is required';
    }

    if (!subRecipeYieldUnit.trim()) {
      newErrors.yieldUnit = 'Unit is required';
    }

    if (subRecipeIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [subRecipeName, subRecipeYield, subRecipeYieldUnit, subRecipeIngredients]);

  const validateFinalRecipeForm = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!selectedMenuItem) {
      newErrors.menuItem = 'Menu item is required';
    }

    if (finalRecipeIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedMenuItem, finalRecipeIngredients]);

  const openAddModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((recipe: SubRecipe | FinalRecipe) => {
    setEditingRecipe(recipe);
    if ('menuItemId' in recipe) {
      // Final recipe
      const menuItem = menuItems.find(m => m.id === recipe.menuItemId);
      setSelectedMenuItem(menuItem || { id: recipe.menuItemId, name: recipe.menuItemName } as Item);
      setFinalRecipeIngredients([...recipe.ingredients]);
    } else {
      // Sub recipe
      setSubRecipeName(recipe.name);
      setSubRecipeYield(recipe.yield);
      setSubRecipeYieldUnit(recipe.yieldUnit);
      setSubRecipeIngredients([...recipe.ingredients]);
    }
    setModalVisible(true);
  }, [menuItems]);

  const handleSaveSubRecipe = useCallback(async () => {
    setTouched({
      recipeName: true,
      yield: true,
      yieldUnit: true,
      ingredients: true,
    });

    if (!validateSubRecipeForm()) {
      return;
    }

    const apiIngredients = subRecipeIngredients.map(ing => ({
      rawMaterialId: ing.ingredientId,
      quantity: ing.quantity,
    }));

    try {
      if (editingRecipe) {
        await dispatch(updateSubRecipeAsync({
          id: editingRecipe.id,
          data: {
            name: subRecipeName.trim(),
            yield: subRecipeYield,
            yieldUnit: subRecipeYieldUnit,
            ingredients: apiIngredients,
          },
        })).unwrap();
      } else {
        await dispatch(createSubRecipeAsync({
          name: subRecipeName.trim(),
          yield: subRecipeYield,
          yieldUnit: subRecipeYieldUnit,
          ingredients: apiIngredients,
        })).unwrap();
      }
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to save sub-recipe. Please try again.');
    }
  }, [
    dispatch,
    editingRecipe,
    subRecipeName,
    subRecipeYield,
    subRecipeYieldUnit,
    subRecipeIngredients,
    resetForm,
    validateSubRecipeForm,
  ]);

  const handleSaveFinalRecipe = useCallback(async () => {
    setTouched({
      menuItem: true,
      ingredients: true,
    });

    if (!validateFinalRecipeForm()) {
      return;
    }

    const apiIngredients = finalRecipeIngredients.map(ing => {
      const isSubRecipe = subRecipes.some(sr => sr.id === ing.ingredientId);
      return isSubRecipe
        ? { subRecipeId: ing.ingredientId, quantity: ing.quantity }
        : { rawMaterialId: ing.ingredientId, quantity: ing.quantity };
    });

    try {
      if (editingRecipe) {
        await dispatch(updateFinalRecipeAsync({
          id: editingRecipe.id,
          data: {
            ingredients: apiIngredients,
          },
        })).unwrap();
      } else {
        await dispatch(createFinalRecipeAsync({
          itemId: selectedMenuItem!.id,
          ingredients: apiIngredients,
        })).unwrap();
      }
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to save final recipe. Please try again.');
    }
  }, [
    dispatch,
    editingRecipe,
    selectedMenuItem,
    finalRecipeIngredients,
    subRecipes,
    resetForm,
    validateFinalRecipeForm,
  ]);

  const handleDeleteRecipe = useCallback((recipe: SubRecipe | FinalRecipe) => {
    setConfirmTitle('Confirm Delete');
    setConfirmMessage('Are you sure you want to delete this recipe?');
    setConfirmColor(COLORS.error);
    setConfirmAction(() => async () => {
      try {
        if ('menuItemId' in recipe) {
          await dispatch(deleteFinalRecipeAsync(recipe.id)).unwrap();
        } else {
          await dispatch(deleteSubRecipeAsync(recipe.id)).unwrap();
        }
        setConfirmVisible(false);
      } catch (error: any) {
        console.error(error);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  }, [dispatch, COLORS.error]);

  const addIngredient = useCallback(
    (ingredient: { id: string; name: string; unit: string }) => {
      const newIngredient: RecipeIngredient = {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: 1,
        unit: ingredient.unit,
      };

      if (activeTab === 'sub') {
        setSubRecipeIngredients(prev => [...prev, newIngredient]);
      } else {
        setFinalRecipeIngredients(prev => [...prev, newIngredient]);
      }
      setShowIngredientPicker(false);
    },
    [activeTab]
  );

  const updateIngredientQuantity = useCallback(
    (index: number, qty: number) => {
      if (activeTab === 'sub') {
        setSubRecipeIngredients(prev =>
          prev.map((ing, i) => (i === index ? { ...ing, quantity: qty } : ing))
        );
      } else {
        setFinalRecipeIngredients(prev =>
          prev.map((ing, i) => (i === index ? { ...ing, quantity: qty } : ing))
        );
      }
    },
    [activeTab]
  );

  const removeIngredient = useCallback(
    (index: number) => {
      if (activeTab === 'sub') {
        setSubRecipeIngredients(prev => prev.filter((_, i) => i !== index));
      } else {
        setFinalRecipeIngredients(prev => prev.filter((_, i) => i !== index));
      }
    },
    [activeTab]
  );

  const availableIngredients = useMemo(() => {
    if (activeTab === 'sub') {
      return rawMaterials.map(m => ({ id: m.id, name: m.name, unit: m.unit }));
    }
    const raw = rawMaterials.map(m => ({ id: m.id, name: m.name, unit: m.unit, type: 'raw' }));
    const intermediate = subRecipes.map(r => ({
      id: r.id,
      name: r.name,
      unit: r.yieldUnit,
      type: 'intermediate',
    }));
    return [...intermediate, ...raw];
  }, [activeTab, rawMaterials, subRecipes]);

  const renderRecipeCard = (recipe: SubRecipe | FinalRecipe, isSubRecipe: boolean) => {
    const name = isSubRecipe ? (recipe as SubRecipe).name : (recipe as FinalRecipe).menuItemName;
    const ingredients = recipe.ingredients;

    return (
      <View
        key={recipe.id}
        style={[styles.recipeCard, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight }]}
      >
        <View style={styles.recipeHeader}>
          <View style={styles.recipeInfo}>
            <Text style={[styles.recipeName, { color: COLORS.textPrimary }]}>{name}</Text>
            {isSubRecipe && (
              <Text style={[styles.recipeYield, { color: COLORS.textSecondary }]}>
                Yields: {(recipe as SubRecipe).yield} {(recipe as SubRecipe).yieldUnit}
              </Text>
            )}
          </View>
          <View style={styles.recipeActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.containerGray }]}
              onPress={() => openEditModal(recipe)}
            >
              <Icon name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.errorBg }]}
              onPress={() => handleDeleteRecipe(recipe)}
            >
              <Icon name="delete" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.ingredientsList, { borderTopColor: COLORS.borderLight }]}>
          <Text style={[styles.ingredientsTitle, { color: COLORS.textSecondary }]}>
            Ingredients:
          </Text>
          {ingredients.map((ing, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={[styles.ingredientName, { color: COLORS.textPrimary }]}>
                {ing.ingredientName}
              </Text>
              <Text style={[styles.ingredientQty, { color: COLORS.textSecondary }]}>
                {ing.quantity} {ing.unit}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTagline}>INVENTORY MANAGEMENT</Text>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Recipe Management</Text>
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
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.subCount}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Sub-Recipes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.finalCount}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Final Recipes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>
              {stats.missingCount}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Needs Recipe</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: COLORS.white }]}>
        <Icon name="magnify" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: COLORS.textPrimary }]}
          placeholder="Search recipes..."
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
            activeTab === 'final' && [styles.activeTab, { backgroundColor: COLORS.primary }],
          ]}
          onPress={() => setActiveTab('final')}
        >
          <Icon
            name="food"
            size={18}
            color={activeTab === 'final' ? '#fff' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'final' ? '#fff' : COLORS.textSecondary },
            ]}
          >
            Menu Items ({finalRecipes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: COLORS.containerGray },
            activeTab === 'sub' && [styles.activeTab, { backgroundColor: COLORS.primary }],
          ]}
          onPress={() => setActiveTab('sub')}
        >
          <Icon
            name="layers-outline"
            size={18}
            color={activeTab === 'sub' ? '#fff' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'sub' ? '#fff' : COLORS.textSecondary },
            ]}
          >
            Sub-Recipes ({subRecipes.length})
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
          {activeTab === 'final' ? (
            filteredFinalRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="book-open-page-variant" size={48} color={COLORS.textTertiary} />
                <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
                  No Final Recipes
                </Text>
                <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                  Link a recipe to a menu item to track costs
                </Text>
              </View>
            ) : (
              filteredFinalRecipes.map(recipe => renderRecipeCard(recipe, false))
            )
          ) : filteredSubRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="layers-off" size={48} color={COLORS.textTertiary} />
              <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
                No Sub-Recipes
              </Text>
              <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                Create intermediate recipes (e.g. Sauce, Dough)
              </Text>
            </View>
          ) : (
            filteredSubRecipes.map(recipe => renderRecipeCard(recipe, true))
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
                  {editingRecipe
                    ? 'Edit Recipe'
                    : activeTab === 'final'
                      ? 'Add Final Recipe'
                      : 'Add Sub-Recipe'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {activeTab === 'sub' ? (
                  <>
                    <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>
                      Recipe Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: COLORS.background, color: COLORS.textPrimary },
                        touched.recipeName && errors.recipeName && styles.inputError,
                      ]}
                      value={subRecipeName}
                      onChangeText={setSubRecipeName}
                      placeholder="e.g., Secret Sauce"
                      placeholderTextColor={COLORS.textTertiary}
                    />

                    <View style={styles.row}>
                      <View style={styles.halfInput}>
                        <ATMInput
                          label="Yield"
                          value={subRecipeYield}
                          onChange={setSubRecipeYield}
                          currency={subRecipeYieldUnit || 'Units'}
                          placeholder="1.00"
                        />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>
                          Unit *
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            { backgroundColor: COLORS.background, color: COLORS.textPrimary },
                            touched.yieldUnit && errors.yieldUnit && styles.inputError,
                          ]}
                          value={subRecipeYieldUnit}
                          onChangeText={setSubRecipeYieldUnit}
                          placeholder="units"
                          placeholderTextColor={COLORS.textTertiary}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.inputLabel, { color: COLORS.textSecondary }]}>
                      Menu Item *
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.picker,
                        { backgroundColor: COLORS.background, borderColor: COLORS.borderLight },
                        touched.menuItem && errors.menuItem && styles.inputError,
                      ]}
                      onPress={() => setShowMenuItemPicker(true)}
                      disabled={!!editingRecipe} // Disable changing item when editing
                    >
                      <Text style={{ color: selectedMenuItem ? COLORS.textPrimary : COLORS.textTertiary }}>
                        {selectedMenuItem?.name || 'Select Menu Item'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.ingredientsSection}>
                  <View style={styles.ingredientsHeader}>
                    <Text style={[styles.inputLabel, { color: COLORS.textSecondary, marginBottom: 0 }]}>
                      Ingredients *
                    </Text>
                    <TouchableOpacity
                      style={[styles.smallAddButton, { backgroundColor: COLORS.primary }]}
                      onPress={() => setShowIngredientPicker(true)}
                    >
                      <Icon name="plus" size={16} color="#fff" />
                      <Text style={styles.smallAddButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {(activeTab === 'sub' ? subRecipeIngredients : finalRecipeIngredients).map(
                    (ing, index) => (
                      <View key={index} style={[styles.ingredientFormRow, { borderColor: COLORS.borderLight, alignItems: 'center' }]}>
                        <View style={{ flex: 1.5 }}>
                          <Text style={[styles.ingredientFormName, { color: COLORS.textPrimary }]} numberOfLines={1}>
                            {ing.ingredientName}
                          </Text>
                          <Text style={[styles.ingredientFormUnit, { color: COLORS.textSecondary, fontSize: 11 }]}>
                            Unit: {ing.unit}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <ATMInput
                            label="Qty"
                            value={ing.quantity}
                            onChange={(val) => updateIngredientQuantity(index, val)}
                            currency=""
                            placeholder="0.00"
                          />
                        </View>
                        <TouchableOpacity onPress={() => removeIngredient(index)} style={{ padding: 4 }}>
                          <Icon name="close-circle" size={22} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    )
                  )}

                  {(activeTab === 'sub' ? subRecipeIngredients : finalRecipeIngredients).length === 0 && (
                    <Text style={[styles.noIngredientsText, { color: COLORS.textTertiary }]}>
                      No ingredients added yet
                    </Text>
                  )}
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
                  onPress={activeTab === 'sub' ? handleSaveSubRecipe : handleSaveFinalRecipe}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Menu Item Picker Modal */}
      <Modal visible={showMenuItemPicker} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowMenuItemPicker(false)} />
          <View style={[styles.pickerModal, { backgroundColor: COLORS.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                Select Menu Item
              </Text>
              <TouchableOpacity onPress={() => setShowMenuItemPicker(false)}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {menuItemsWithoutRecipe.length === 0 ? (
                <Text style={[styles.emptyPickerText, { color: COLORS.textSecondary }]}>
                  All items already have recipes
                </Text>
              ) : (
                menuItemsWithoutRecipe.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.pickerItem, { borderBottomColor: COLORS.borderLight }]}
                    onPress={() => {
                      setSelectedMenuItem(item);
                      setShowMenuItemPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, { color: COLORS.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.pickerItemPrice, { color: COLORS.textSecondary }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ingredient Picker Modal */}
      <Modal visible={showIngredientPicker} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowIngredientPicker(false)} />
          <View style={[styles.pickerModal, { backgroundColor: COLORS.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                Select Ingredient
              </Text>
              <TouchableOpacity onPress={() => setShowIngredientPicker(false)}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {availableIngredients.length === 0 ? (
                <Text style={[styles.emptyPickerText, { color: COLORS.textSecondary }]}>
                  No ingredients available
                </Text>
              ) : (
                availableIngredients.map(ing => (
                  <TouchableOpacity
                    key={ing.id}
                    style={[styles.pickerItem, { borderBottomColor: COLORS.borderLight }]}
                    onPress={() => addIngredient(ing)}
                  >
                    <Text style={[styles.pickerItemText, { color: COLORS.textPrimary }]}>{ing.name}</Text>
                    <Text style={[styles.pickerItemPrice, { color: COLORS.textSecondary }]}>
                      {ing.unit}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
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
  headerTitle: { fontSize: 24, fontWeight: '800' }, // Slightly smaller to fit "Recipe Management"
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
  recipeCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  recipeYield: {
    fontSize: 13,
  },
  recipeActions: {
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
  ingredientsList: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  ingredientsTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ingredientName: {
    fontSize: 14,
  },
  ingredientQty: {
    fontSize: 14,
    fontWeight: '500',
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
    padding: 20, // Add padding
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidingWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    maxHeight: '90%', // Increased height
    overflow: 'hidden',
    flexShrink: 1, // Allow shrinking if keyboard appears
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
  picker: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ingredientsSection: {
    marginTop: 8,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  smallAddButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ingredientFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  ingredientFormName: {
    flex: 1,
    fontSize: 14,
  },
  ingredientQtyInput: {
    width: 70,
    height: 36,
    borderRadius: 8,
    textAlign: 'right',
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientFormUnit: {
    width: 40,
    fontSize: 12,
  },
  noIngredientsText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
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
  pickerModal: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  pickerList: {
    padding: 0,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItemPrice: {
    fontSize: 14,
  },
  emptyPickerText: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
  },
});

export default RecipeManagementScreen;
