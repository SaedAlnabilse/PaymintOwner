# Reports Dashboard - Color System

## 🎨 Color Palette

### Primary Colors

#### Indigo - Primary Brand Color
```
#6366F1
RGB: 99, 102, 241
```
**Usage:**
- Featured Net Sales card background
- Selected date range buttons
- Primary action buttons
- Top selling items revenue text
- Order number badges
- Section badges

**Visual Impact:** Creates a modern, professional, trustworthy impression

---

### Accent Colors (Stat Cards)

#### Purple - Card Payments
```
#8B5CF6
RGB: 139, 92, 246
```
**Usage:** Card Sales stat card border & icon

#### Green - Cash & Success
```
#10B981
RGB: 16, 185, 129
```
**Usage:** 
- Cash Sales stat card border & icon
- Success status badges
- Trend indicators

#### Blue - Orders
```
#3B82F6
RGB: 59, 130, 246
```
**Usage:** Total Orders stat card border & icon

#### Red - Errors & Refunds
```
#EF4444
RGB: 239, 68, 68
```
**Usage:**
- Refunds stat card border & icon
- Refunded order badges
- Negative amounts
- Error states

#### Orange - Time & Warnings
```
#F59E0B
RGB: 245, 158, 11
```
**Usage:**
- Hours Worked stat card border & icon
- Trophy/achievements icon color
- Gold medal background

#### Teal - Other Payments
```
#14B8A6
RGB: 20, 184, 166
```
**Usage:** Other Payments stat card border & icon

---

### Neutral Colors

#### Dark Slate - Primary Text
```
#1E293B
RGB: 30, 41, 59
```
**Usage:**
- Main headings
- Primary values/numbers
- Order amounts
- Important text

**Contrast Ratio:** 15.5:1 on white (WCAG AAA)

#### Medium Slate - Secondary Text
```
#64748B
RGB: 100, 116, 139
```
**Usage:**
- Labels and subtitles
- Descriptive text
- Timestamps
- Employee names
- Meta information

**Contrast Ratio:** 7.2:1 on white (WCAG AA)

#### Light Slate - Tertiary Text
```
#94A3B8
RGB: 148, 163, 184
```
**Usage:**
- Placeholder text
- Empty state messages
- Disabled text
- Very subtle information

**Contrast Ratio:** 4.5:1 on white (WCAG AA for large text)

---

### Background Colors

#### Main Background
```
#F8FAFC
RGB: 248, 250, 252
```
**Usage:** Primary screen background

#### Card Background
```
#F1F5F9
RGB: 241, 245, 249
```
**Usage:**
- Stat card icon containers
- Unselected state backgrounds
- Subtle dividers

#### Border Colors
```
#E2E8F0
RGB: 226, 232, 240
```
**Usage:**
- Card borders
- Divider lines
- Subtle separators

#### Badge Background
```
#EEF2FF
RGB: 238, 242, 255
```
**Usage:**
- Badge backgrounds (indigo tint)
- Highlighted areas
- Top item quantity badges

---

### Medal/Achievement Colors

#### Gold (1st Place)
```
#FEF3C7
RGB: 254, 243, 199
```
**Usage:** #1 top selling item background

#### Silver (2nd Place)
```
#F1F5F9
RGB: 241, 245, 249
```
**Usage:** #2 top selling item background

#### Bronze (3rd Place)
```
#FED7AA
RGB: 254, 215, 170
```
**Usage:** #3 top selling item background

---

### Success States

#### Success Background
```
#D1FAE5
RGB: 209, 250, 229
```
**Usage:** Paid/completed order status badges

#### Success Text
```
#059669
RGB: 5, 150, 105
```
**Usage:** Success status text

---

### Error States

#### Error Background
```
#FEE2E2
RGB: 254, 226, 226
```
**Usage:** Refunded/error status badges

#### Error Text
```
#DC2626
RGB: 220, 38, 38
```
**Usage:** Error status text, refund amounts

---

## 🎯 Usage Guidelines

### Color Hierarchy
1. **Primary (Indigo):** Most important actions, featured content
2. **Accents:** Category-specific information, visual coding
3. **Neutrals:** Text hierarchy (dark → medium → light)
4. **Backgrounds:** Depth and separation
5. **States:** Success, error, warning indicators

### Accessibility
- All text colors meet WCAG AA standards minimum
- Primary text meets WCAG AAA standards
- High contrast between text and backgrounds
- Color is never the only indicator (icons + text)

### Psychology
- **Indigo:** Trust, professionalism, technology
- **Green:** Growth, success, cash (familiar)
- **Red:** Attention, caution, refunds
- **Purple:** Premium, sophistication
- **Orange:** Energy, time-sensitive
- **Blue:** Reliability, information
- **Teal:** Balance, unique transactions

### Consistency
- Each stat category has ONE dedicated color
- Icons match their category color
- Status colors are consistent throughout app
- Shadows use themed colors where appropriate

---

## 📱 Implementation Notes

### React Native StyleSheet
```javascript
const COLORS = {
  // Primary
  primary: '#6366F1',
  
  // Accents
  purple: '#8B5CF6',
  green: '#10B981',
  blue: '#3B82F6',
  red: '#EF4444',
  orange: '#F59E0B',
  teal: '#14B8A6',
  
  // Neutrals
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  
  // Backgrounds
  background: '#F8FAFC',
  cardBg: '#F1F5F9',
  borderColor: '#E2E8F0',
  badgeBg: '#EEF2FF',
  
  // States
  successBg: '#D1FAE5',
  successText: '#059669',
  errorBg: '#FEE2E2',
  errorText: '#DC2626',
};
```

### Shadow System
```javascript
// Level 1 - Subtle
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 8,
elevation: 3,

// Level 2 - Medium
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.1,
shadowRadius: 12,
elevation: 8,

// Level 3 - Strong (Featured)
shadowColor: '#6366F1',
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.3,
shadowRadius: 16,
elevation: 12,
```

---

## 🔄 Migration from Old Colors

| Old Color | New Color | Element |
|-----------|-----------|---------|
| #7CC39F | #6366F1 | Primary/featured elements |
| #F5F5F5 | #F8FAFC | Background |
| #333333 | #1E293B | Primary text |
| #666666 | #64748B | Secondary text |
| #999999 | #94A3B8 | Tertiary text |
| #D55263 | #EF4444 | Errors/refunds |

This creates a more modern, professional, and cohesive visual system that significantly enhances the user experience.
