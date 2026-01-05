export type ItemType = 'raw' | 'intermediate' | 'final';

export interface RawMaterial {
  id: string;
  name: string;
  unit: string; // e.g., 'kg', 'liters', 'pieces'
  quantity: number;
  costPerUnit: number;
  lowStockThreshold?: number;
}

export interface RecipeIngredient {
  ingredientId: string; // Can be raw material ID or intermediate product ID
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface SubRecipe {
  id: string;
  name: string; // Name of the intermediate product
  description?: string;
  ingredients: RecipeIngredient[]; // Raw materials needed
  yield: number; // How many units this recipe produces
  yieldUnit: string;
  quantity: number; // Available stock of this intermediate product
}

export interface FinalRecipe {
  id: string;
  menuItemId: string; // Links to existing MenuItem
  menuItemName: string;
  ingredients: RecipeIngredient[]; // Can be raw materials or intermediate products
}

export interface ManufacturingState {
  rawMaterials: RawMaterial[];
  intermediateProducts: { [id: string]: number }; // id -> quantity in stock
  subRecipes: SubRecipe[];
  finalRecipes: FinalRecipe[];
  isLoading: boolean;
  error: string | null;
}

export interface IngredientAvailability {
  ingredientId: string;
  ingredientName: string;
  required: number;
  available: number;
  canManufacture: boolean;
  shortage: number;
}

export interface ProductAvailability {
  canMake: boolean;
  availableQuantity: number;
  missingIngredients: IngredientAvailability[];
}
