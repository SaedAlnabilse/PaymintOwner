export interface LiveShiftReport {
  type: 'CURRENT_SHIFT' | 'LAST_SHIFT' | 'NO_SHIFT';
  shiftStartTime?: string | null;
  shift?: {
    id: string;
    userId: string;
    registerId: string;
    state: 'OPEN' | 'CLOSING' | 'CLOSED';
    startTime: string;
    endTime?: string;
    openingBalance: number;
    closingBalance?: number;
    totalPayIn: number;
    totalPayOut: number;
    user: {
      id: string;
      name: string;
      username: string;
    };
  };
  metrics?: {
    totalSales: number;
    cashSales: number;
    cardSales: number;
    otherSales: number;
    orderCount: number;
    openingBalance: number;
    totalPayIn: number;
    totalPayOut: number;
    expectedCashBalance?: number;
    expectedBalance?: number;
    discrepancy?: number;
  };
}

export interface OrderHistoryFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderHistoryItem {
  id: string;
  orderNumber: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: any[];
}

export interface HistoricalSummary {
  totalNetSales: number;
  totalCardSales: number;
  totalCashSales: number;
  totalOtherPayments: number;
  totalOrders: number;
  totalRefunds: number;
  totalPayIn: number;
  totalPayOut: number;
  totalHoursWorked: number;
}

export interface HistoricalOrder {
  id: string;
  orderNumber: number;
  total: number;
  paymentMethod:
    | 'CASH'
    | 'CARD'
    | 'TALABAT'
    | 'CAREEM'
    | 'APPLE_PAY'
    | 'ZAIN_CASH'
    | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED';
  createdAt: string;
  employeeName: string;
  employeeId: string;
  refundReason: string | null;
  isRefunded: boolean;
  items?: any[];
}

export interface TopSellingItem {
  itemId: string;
  name: string;
  imageUrl: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  price: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
}

export interface NotificationItem {
  id: string;
  availableStock: number;
  name: string;
}

export type NotificationType =
  | 'STOCK_ALERT_YELLOW'
  | 'STOCK_ALERT_RED'
  | 'OUT_OF_STOCK'
  | 'SYSTEM'
  | 'PASSWORD_RESET'
  | 'HELD_ORDER';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  itemId?: string;
  userId?: string;
  item?: NotificationItem;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  metadata?: Record<string, unknown>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface OrderItemSubAttribute {
  subAttributeId: string;
  subAttribute: {
    id: string;
    name: string;
    price: number;
    priceAdjustment?: number;
  };
}

export interface OrderItemDiscount {
  id: string;
  name: string;
  percentage: number;
}

export interface OrderItem {
  id: string;
  cartItemId: string;
  itemId: string;
  productId: string;
  name: string;
  basePrice: number;
  finalPrice: number;
  quantity: number;
  price: number;
  subtotal: number;
  selectedSubAttributeIds: string[];
  imageUrl?: string;
  itemSubAttributes?: OrderItemSubAttribute[];
  selectedAttributes?: { id: string; name: string; value: string }[];
  note?: string;
  description?: string;
  discount?: OrderItemDiscount;
}

export interface OrderTax {
  id: string;
  name: string;
  rate: number;
  is_active: boolean;
}

export interface OrderDetails {
  id: string;
  orderNumber: number;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
  total: number;
  subtotal: number;
  tax: number;
  paymentMethod: 'card' | 'cash' | 'CASH' | 'CARD' | 'OTHER' | 'BILLING';
  cashTendered?: number;
  change?: number;
  note?: string;
  invoiceNumber?: string;
  date?: string;
  discount: OrderItemDiscount | null;
  discountAmount?: number; // Added discountAmount
  taxes: OrderTax[];
  name?: string;
  employeeName?: string;
  employeeId?: string;
  refundReason?: string | null;
  isRefunded?: boolean;
}

export interface PayInPayOutLogEntry {
  id: string;
  type:
    | 'PAY_IN'
    | 'PAY_OUT'
    | 'SHIFT_START'
    | 'SHIFT_END'
    | 'CASH_IN'
    | 'CASH_OUT';
  amount?: number;
  reason?: string;
  note?: string;
  timestamp: string;
  createdAt?: string; // Added to match potential backend response
  userName: string;
}

export interface PayInPayOutLogResponse {
  entries: PayInPayOutLogEntry[];
  total: number;
}

export interface ShiftSummary {
  id: string;
  startTime: string;
  endTime: string | null;
  userName: string;
  totalSales: number;
  cashSales: number;
  cardSales: number;
}
