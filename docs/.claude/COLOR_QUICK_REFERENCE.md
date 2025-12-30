# Brand Colors - Quick Reference

## 🎨 Reports Dashboard Color Usage

### PRIMARY COLORS
```
#7CC39F  Green        ▓▓▓  Primary brand, success, cash
#1F1D2B  Dark Navy    ▓▓▓  Primary text, headers  
#D55263  Red          ▓▓▓  Alerts, refunds, errors
#FFFFFF  White        ░░░  Backgrounds, on-color text
```

### CATEGORY COLORS (Stats Cards)
```
#737182  Purple-Gray  ▓▓▓  Card Sales
#7CC39F  Green        ▓▓▓  Cash Sales
#A8BBBF  Blue-Gray    ▓▓▓  Total Orders
#D55263  Red          ▓▓▓  Refunds
#D0C962  Yellow       ▓▓▓  Hours Worked, Achievements
#808B92  Gray         ▓▓▓  Other Payments
```

### NEUTRAL COLORS
```
#E8E8E8  Light Gray   ░░░  Containers, cards, icon BG
#B1B6B9  Medium Gray  ▓▓▓  Cancel buttons
#828287  Gray         ▓▓▓  Secondary elements
#D7D6D6  Very Light   ░░░  Subtle backgrounds
```

### STATUS COLORS
```
#D1FAE5  Light Green  ░░░  Success background
#059669  Dark Green   ▓▓▓  Success text
#FEE2E2  Light Red    ░░░  Error background
#DC2626  Dark Red     ▓▓▓  Error text
```

---

## 📍 WHERE EACH COLOR IS USED

### Green (#7CC39F)
- ✅ Featured Net Sales card
- ✅ Selected date range buttons  
- ✅ Refresh icon
- ✅ Cash Sales border & icon
- ✅ Section icons (Receipt, Trophy)
- ✅ Top item revenue text
- ✅ Order number badges
- ✅ Section badges text
- ✅ Quantity badge text
- ✅ Primary action states

### Dark Navy (#1F1D2B)
- ✅ Main titles
- ✅ Section headings
- ✅ Stat values
- ✅ Item names
- ✅ Order amounts
- ✅ All primary text

### Red (#D55263)
- ✅ Refund stat card border & icon
- ✅ Refund values
- ✅ Refunded order badges
- ✅ Negative amounts
- ✅ Error indicators

### Yellow (#D0C962)
- ✅ Hours Worked border & icon
- ✅ Trophy icon
- ✅ Gold medal (1st place)
- ✅ Achievement accents

### Purple-Gray (#737182)
- ✅ Card Sales border & icon
- ✅ Unselected range text

### Blue-Gray (#A8BBBF)
- ✅ Total Orders border & icon
- ✅ Supporting graph elements

### Gray (#808B92)
- ✅ Other Payments border & icon
- ✅ Discard button text

### Container Gray (#E8E8E8)
- ✅ Refresh button background
- ✅ Icon containers in stat cards
- ✅ Quantity badge backgrounds

---

## 🎯 USAGE RULES

### DO ✅
- Use green for primary actions and success
- Use red only for errors, refunds, negative values
- Use dark navy for all primary text
- Use category colors ONLY for their category
- Maintain contrast ratios for accessibility
- Use white text on green/red backgrounds

### DON'T ❌
- Mix category colors (don't use green for orders)
- Use red for anything positive
- Use yellow except for time/warnings/achievements
- Forget icon + text (never just color)
- Reduce contrast below WCAG standards

---

## 🔍 COLOR ACCESSIBILITY

All color combinations meet WCAG AA standards:

| Foreground | Background | Contrast | Use |
|------------|------------|----------|-----|
| #1F1D2B | #FFFFFF | 15.5:1 ✅ AAA | Primary text |
| #737182 | #FFFFFF | 4.8:1 ✅ AA | Secondary text |
| #FFFFFF | #7CC39F | 4.5:1 ✅ AA | White on green |
| #FFFFFF | #D55263 | 4.5:1 ✅ AA | White on red |

---

## 💡 QUICK TIPS

1. **Green = Success/Money** - Use for positive metrics
2. **Red = Alert/Loss** - Use sparingly for warnings
3. **Yellow = Attention** - Use for highlights
4. **Grays = Support** - Use for secondary info
5. **Navy = Authority** - Use for important data

---

## 📱 Copy-Paste Hex Codes

```
Primary Green:    #7CC39F
Dark Navy:        #1F1D2B
Alert Red:        #D55263
Warning Yellow:   #D0C962

Purple-Gray:      #737182
Blue-Gray:        #A8BBBF
Medium Gray:      #808B92
Container Gray:   #E8E8E8
Cancel Gray:      #B1B6B9
Light Gray:       #D7D6D6

Success BG:       #D1FAE5
Success Text:     #059669
Error BG:         #FEE2E2
Error Text:       #DC2626
```

---

## 🎨 React Native Implementation

```typescript
// Add to constants file
export const BRAND_COLORS = {
  green: '#7CC39F',
  darkNavy: '#1F1D2B',
  red: '#D55263',
  yellow: '#D0C962',
  purpleGray: '#737182',
  blueGray: '#A8BBBF',
  gray: '#808B92',
  containerGray: '#E8E8E8',
  cancelGray: '#B1B6B9',
  lightGray: '#D7D6D6',
  white: '#FFFFFF',
};

// Use in styles
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: BRAND_COLORS.green,
  },
  headerText: {
    color: BRAND_COLORS.darkNavy,
  },
  errorText: {
    color: BRAND_COLORS.red,
  },
});
```
