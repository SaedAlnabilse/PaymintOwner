import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  ManufacturingState,
  RawMaterial,
  SubRecipe,
  FinalRecipe,
} from '../../types/manufacturing';
import { manufacturingService, CreateRawMaterialDto, UpdateRawMaterialDto } from '../../services/manufacturing';

const initialState: ManufacturingState = {
  rawMaterials: [],
  intermediateProducts: {},
  subRecipes: [],
  finalRecipes: [],
  isLoading: false,
  error: null,
};

// ============================================
// ASYNC THUNKS - RAW MATERIALS
// ============================================

export const fetchRawMaterials = createAsyncThunk(
  'manufacturing/fetchRawMaterials',
  async (_, { rejectWithValue }) => {
    try {
      const data = await manufacturingService.getRawMaterials();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch raw materials');
    }
  }
);

export const createRawMaterialAsync = createAsyncThunk(
  'manufacturing/createRawMaterial',
  async (data: CreateRawMaterialDto, { rejectWithValue }) => {
    try {
      const result = await manufacturingService.createRawMaterial(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create raw material');
    }
  }
);

export const updateRawMaterialAsync = createAsyncThunk(
  'manufacturing/updateRawMaterial',
  async ({ id, data }: { id: string; data: UpdateRawMaterialDto }, { rejectWithValue }) => {
    try {
      const result = await manufacturingService.updateRawMaterial(id, data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update raw material');
    }
  }
);

export const restockRawMaterialAsync = createAsyncThunk(
  'manufacturing/restockRawMaterial',
  async ({ id, amount }: { id: string; amount: number }, { rejectWithValue }) => {
    try {
      const result = await manufacturingService.restockRawMaterial(id, amount);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to restock raw material');
    }
  }
);

export const deleteRawMaterialAsync = createAsyncThunk(
  'manufacturing/deleteRawMaterial',
  async (id: string, { rejectWithValue }) => {
    try {
      await manufacturingService.deleteRawMaterial(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete raw material');
    }
  }
);

// ============================================
// ASYNC THUNKS - SUB-RECIPES
// ============================================

export const fetchSubRecipes = createAsyncThunk(
  'manufacturing/fetchSubRecipes',
  async (_, { rejectWithValue }) => {
    try {
      const data = await manufacturingService.getSubRecipes();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sub-recipes');
    }
  }
);

export const createSubRecipeAsync = createAsyncThunk(
  'manufacturing/createSubRecipe',
  async (
    data: {
      name: string;
      description?: string;
      yield?: number;
      yieldUnit?: string;
      ingredients: { rawMaterialId: string; quantity: number }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await manufacturingService.createSubRecipe(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create sub-recipe');
    }
  }
);

export const updateSubRecipeAsync = createAsyncThunk(
  'manufacturing/updateSubRecipe',
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        yield?: number;
        yieldUnit?: string;
        ingredients?: { rawMaterialId: string; quantity: number }[];
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await manufacturingService.updateSubRecipe(id, data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update sub-recipe');
    }
  }
);

export const manufactureSubRecipeAsync = createAsyncThunk(
  'manufacturing/manufactureSubRecipe',
  async ({ id, batches }: { id: string; batches: number }, { rejectWithValue, dispatch }) => {
    try {
      const result = await manufacturingService.manufactureSubRecipe(id, batches);
      // Refresh raw materials since they were deducted
      dispatch(fetchRawMaterials());
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to manufacture sub-recipe');
    }
  }
);

export const deleteSubRecipeAsync = createAsyncThunk(
  'manufacturing/deleteSubRecipe',
  async (id: string, { rejectWithValue }) => {
    try {
      await manufacturingService.deleteSubRecipe(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete sub-recipe');
    }
  }
);

// ============================================
// ASYNC THUNKS - FINAL RECIPES
// ============================================

export const fetchFinalRecipes = createAsyncThunk(
  'manufacturing/fetchFinalRecipes',
  async (_, { rejectWithValue }) => {
    try {
      const data = await manufacturingService.getFinalRecipes();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch final recipes');
    }
  }
);

export const createFinalRecipeAsync = createAsyncThunk(
  'manufacturing/createFinalRecipe',
  async (
    data: {
      itemId: string;
      ingredients: { rawMaterialId?: string; subRecipeId?: string; quantity: number }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await manufacturingService.createFinalRecipe(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create final recipe');
    }
  }
);

export const updateFinalRecipeAsync = createAsyncThunk(
  'manufacturing/updateFinalRecipe',
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        ingredients?: { rawMaterialId?: string; subRecipeId?: string; quantity: number }[];
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await manufacturingService.updateFinalRecipe(id, data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update final recipe');
    }
  }
);

export const deleteFinalRecipeAsync = createAsyncThunk(
  'manufacturing/deleteFinalRecipe',
  async (id: string, { rejectWithValue }) => {
    try {
      await manufacturingService.deleteFinalRecipe(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete final recipe');
    }
  }
);

// Fetch all manufacturing data at once
export const fetchAllManufacturingData = createAsyncThunk(
  'manufacturing/fetchAll',
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchRawMaterials()),
      dispatch(fetchSubRecipes()),
      dispatch(fetchFinalRecipes()),
    ]);
  }
);

const manufacturingSlice = createSlice({
  name: 'manufacturing',
  initialState,
  reducers: {
    // Local state updates (for optimistic UI updates if needed)
    setRawMaterials: (state, action: PayloadAction<RawMaterial[]>) => {
      state.rawMaterials = action.payload;
    },
    setSubRecipes: (state, action: PayloadAction<SubRecipe[]>) => {
      state.subRecipes = action.payload;
    },
    setFinalRecipes: (state, action: PayloadAction<FinalRecipe[]>) => {
      state.finalRecipes = action.payload;
    },
    setIntermediateProducts: (
      state,
      action: PayloadAction<{ [id: string]: number }>
    ) => {
      state.intermediateProducts = action.payload;
    },

    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reset state
    resetManufacturing: () => initialState,
  },
  extraReducers: (builder) => {
    // Raw Materials
    builder
      .addCase(fetchRawMaterials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRawMaterials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rawMaterials = action.payload;
      })
      .addCase(fetchRawMaterials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createRawMaterialAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRawMaterialAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rawMaterials.push(action.payload);
      })
      .addCase(createRawMaterialAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateRawMaterialAsync.fulfilled, (state, action) => {
        const index = state.rawMaterials.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.rawMaterials[index] = action.payload;
        }
      })
      .addCase(restockRawMaterialAsync.fulfilled, (state, action) => {
        const index = state.rawMaterials.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.rawMaterials[index] = action.payload;
        }
      })
      .addCase(deleteRawMaterialAsync.fulfilled, (state, action) => {
        state.rawMaterials = state.rawMaterials.filter(m => m.id !== action.payload);
      })

      // Sub-Recipes
      .addCase(fetchSubRecipes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubRecipes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subRecipes = action.payload;
        // Also update intermediate products from sub-recipes
        const products: { [id: string]: number } = {};
        action.payload.forEach((recipe: any) => {
          if (recipe.quantity !== undefined) {
            products[recipe.id] = recipe.quantity;
          }
        });
        state.intermediateProducts = products;
      })
      .addCase(fetchSubRecipes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createSubRecipeAsync.fulfilled, (state, action) => {
        state.subRecipes.push(action.payload);
      })
      .addCase(updateSubRecipeAsync.fulfilled, (state, action) => {
        const index = state.subRecipes.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.subRecipes[index] = action.payload;
        }
      })
      .addCase(manufactureSubRecipeAsync.fulfilled, (state, action) => {
        const index = state.subRecipes.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.subRecipes[index] = action.payload;
          // Update intermediate products quantity
          if ((action.payload as any).quantity !== undefined) {
            state.intermediateProducts[action.payload.id] = (action.payload as any).quantity;
          }
        }
      })
      .addCase(deleteSubRecipeAsync.fulfilled, (state, action) => {
        state.subRecipes = state.subRecipes.filter(r => r.id !== action.payload);
        delete state.intermediateProducts[action.payload];
      })

      // Final Recipes
      .addCase(fetchFinalRecipes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFinalRecipes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.finalRecipes = action.payload;
      })
      .addCase(fetchFinalRecipes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createFinalRecipeAsync.fulfilled, (state, action) => {
        // Remove existing recipe for the same menu item if exists
        state.finalRecipes = state.finalRecipes.filter(
          r => r.menuItemId !== action.payload.menuItemId
        );
        state.finalRecipes.push(action.payload);
      })
      .addCase(updateFinalRecipeAsync.fulfilled, (state, action) => {
        const index = state.finalRecipes.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.finalRecipes[index] = action.payload;
        }
      })
      .addCase(deleteFinalRecipeAsync.fulfilled, (state, action) => {
        state.finalRecipes = state.finalRecipes.filter(r => r.id !== action.payload);
      });
  },
});

export const {
  setRawMaterials,
  setSubRecipes,
  setFinalRecipes,
  setIntermediateProducts,
  setLoading,
  setError,
  resetManufacturing,
} = manufacturingSlice.actions;

export default manufacturingSlice.reducer;
