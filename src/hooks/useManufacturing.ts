import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  manufactureSubRecipeAsync,
} from '../store/slices/manufacturingSlice';
import { ProductAvailability, IngredientAvailability } from '../types/manufacturing';

export const useManufacturing = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    rawMaterials,
    intermediateProducts,
    subRecipes,
    finalRecipes,
  } = useSelector((state: RootState) => state.manufacturing);

  // Check if raw materials are available for a sub-recipe
  const checkRawMaterialsAvailable = useCallback(
    (recipeId: string, quantity: number = 1): boolean => {
      const recipe = subRecipes.find(r => r.id === recipeId);
      if (!recipe) return true;

      for (const ingredient of recipe.ingredients) {
        const material = rawMaterials.find(m => m.id === ingredient.ingredientId);
        if (!material || material.quantity < ingredient.quantity * quantity) {
          return false;
        }
      }
      return true;
    },
    [subRecipes, rawMaterials]
  );

  // Get detailed availability for sub-recipe ingredients
  const getSubRecipeAvailability = useCallback(
    (recipeId: string, quantity: number = 1): IngredientAvailability[] => {
      const recipe = subRecipes.find(r => r.id === recipeId);
      if (!recipe) return [];

      return recipe.ingredients.map(ingredient => {
        const material = rawMaterials.find(m => m.id === ingredient.ingredientId);
        const available = material?.quantity || 0;
        const required = ingredient.quantity * quantity;

        return {
          ingredientId: ingredient.ingredientId,
          ingredientName: ingredient.ingredientName,
          required,
          available,
          canManufacture: false, // Raw materials can't be manufactured
          shortage: Math.max(0, required - available),
        };
      });
    },
    [subRecipes, rawMaterials]
  );

  // Check if a menu item can be made (including auto-manufacturing)
  const canMakeProduct = useCallback(
    (menuItemId: string, quantity: number = 1): ProductAvailability => {
      const recipe = finalRecipes.find(r => r.menuItemId === menuItemId);

      // If no recipe, item is a simple product - check basic stock
      if (!recipe) {
        return {
          canMake: true, // No recipe means no manufacturing constraints
          availableQuantity: Infinity,
          missingIngredients: [],
        };
      }

      const missingIngredients: IngredientAvailability[] = [];
      let canMake = true;
      let maxQuantity = Infinity;

      for (const ingredient of recipe.ingredients) {
        const required = ingredient.quantity * quantity;

        // Check if it's a raw material
        const rawMaterial = rawMaterials.find(m => m.id === ingredient.ingredientId);
        if (rawMaterial) {
          const available = rawMaterial.quantity;
          if (available < required) {
            canMake = false;
            missingIngredients.push({
              ingredientId: ingredient.ingredientId,
              ingredientName: ingredient.ingredientName,
              required,
              available,
              canManufacture: false,
              shortage: required - available,
            });
          }
          maxQuantity = Math.min(
            maxQuantity,
            Math.floor(available / ingredient.quantity)
          );
          continue;
        }

        // Check if it's an intermediate product
        const intermediateStock = intermediateProducts[ingredient.ingredientId] || 0;
        const subRecipe = subRecipes.find(r => r.id === ingredient.ingredientId);

        if (intermediateStock >= required) {
          // Enough in stock
          maxQuantity = Math.min(
            maxQuantity,
            Math.floor(intermediateStock / ingredient.quantity)
          );
          continue;
        }

        // Not enough - can we manufacture more?
        const shortage = required - intermediateStock;
        const canManufactureMore = subRecipe
          ? checkRawMaterialsAvailable(subRecipe.id, Math.ceil(shortage / subRecipe.yield))
          : false;

        if (!canManufactureMore) {
          canMake = false;
        }

        if (intermediateStock < required) {
          missingIngredients.push({
            ingredientId: ingredient.ingredientId,
            ingredientName: subRecipe?.name || ingredient.ingredientName,
            required,
            available: intermediateStock,
            canManufacture: canManufactureMore,
            shortage,
          });
        }

        if (canManufactureMore && subRecipe) {
          // Calculate how many we could make with available raw materials
          const rawAvailability = getSubRecipeAvailability(subRecipe.id, 1);
          const possibleBatches = Math.min(
            ...rawAvailability.map(ra =>
              ra.required > 0 ? Math.floor(ra.available / ra.required) : Infinity
            )
          );
          const possibleIntermediateUnits = intermediateStock + possibleBatches * subRecipe.yield;
          maxQuantity = Math.min(
            maxQuantity,
            Math.floor(possibleIntermediateUnits / ingredient.quantity)
          );
        }
      }

      return {
        canMake,
        availableQuantity: maxQuantity === Infinity ? 999 : maxQuantity,
        missingIngredients,
      };
    },
    [
      finalRecipes,
      rawMaterials,
      intermediateProducts,
      subRecipes,
      checkRawMaterialsAvailable,
      getSubRecipeAvailability,
    ]
  );

  // Manufacture an intermediate product (calls API)
  const manufactureProduct = useCallback(
    async (recipeId: string, quantity: number = 1): Promise<boolean> => {
      if (!checkRawMaterialsAvailable(recipeId, quantity)) {
        return false;
      }

      try {
        await dispatch(manufactureSubRecipeAsync({ id: recipeId, batches: quantity })).unwrap();
        return true;
      } catch (error) {
        console.error('Failed to manufacture:', error);
        return false;
      }
    },
    [dispatch, checkRawMaterialsAvailable]
  );

  // Deduct inventory when selling - handled by backend now
  // The backend automatically deducts ingredients when an order is placed
  const deductInventoryForSale = useCallback(
    (_menuItemId: string, _quantity: number = 1): boolean => {
      // This is now handled by the backend automatically when creating orders
      // We just return true - the actual deduction happens server-side
      return true;
    },
    []
  );

  // Get recipe for a menu item
  const getRecipeForMenuItem = useCallback(
    (menuItemId: string) => {
      return finalRecipes.find(r => r.menuItemId === menuItemId);
    },
    [finalRecipes]
  );

  // Get sub-recipe by ID
  const getSubRecipe = useCallback(
    (recipeId: string) => {
      return subRecipes.find(r => r.id === recipeId);
    },
    [subRecipes]
  );

  // Get all items with low stock (raw materials)
  const lowStockItems = useMemo(() => {
    return rawMaterials.filter(
      m => m.lowStockThreshold && m.quantity <= m.lowStockThreshold
    );
  }, [rawMaterials]);

  // Get intermediate products with their names
  const intermediateProductsList = useMemo(() => {
    return subRecipes.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      quantity: intermediateProducts[recipe.id] || 0,
      unit: recipe.yieldUnit,
    }));
  }, [subRecipes, intermediateProducts]);

  return {
    rawMaterials,
    intermediateProducts,
    intermediateProductsList,
    subRecipes,
    finalRecipes,
    lowStockItems,
    checkRawMaterialsAvailable,
    getSubRecipeAvailability,
    canMakeProduct,
    manufactureProduct,
    deductInventoryForSale,
    getRecipeForMenuItem,
    getSubRecipe,
  };
};
