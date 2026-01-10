export interface Discount {
  id: string;
  name: string;
  percentage: number;
  adminOnly?: boolean;
  appSettingsId?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  logo?: string;
  appSettingsId?: string;
}

export interface CardType {
  id: string;
  name: string;
  logo?: string;
  imageUrl?: string;
  imageKey?: string;
  appSettingsId?: string;
}

export interface LoyaltyReward {
  id: string;
  type: 'DISCOUNT' | 'FREE_ITEM';
  name: string;
  pointsRequired: number;
  discountPercentage?: number;
  freeCategoryId?: string;
  freeCategoryName?: string;
}

export interface LoyaltyConfig {
  enabled: boolean;
  pointsPerCurrency: number;
  currencyPerPoint: number;

  rewards: LoyaltyReward[];
}

export interface AppSettings {
  id: string;
  restaurantName: string;
  restaurantDescription?: string;
  restaurantAddress?: string;
  logo: string | null;
  currency: string;
  taxRate: number;
  openingTime: string;
  closingTime: string;
  farewellMessage: string;
  createdAt: string;
  discounts: Discount[];
  paymentMethods: PaymentMethod[];
  cardTypes: CardType[];
  // Receipt display options
  showRestaurantName?: boolean;
  showDescription?: boolean;
  showAddress?: boolean;
  showTaxId?: boolean;
  showFarewellMessage?: boolean;
  taxIdNumber?: string;
  // Hold Order table shortcuts
  holdOrderTableCount?: number;
}