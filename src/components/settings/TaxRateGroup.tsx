import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import ATMInput from '../common/ATMInput';

interface TaxRateGroupProps {
  taxRate: number;
  onChange: (value: number) => void;
  error?: string;
}

const TaxRateGroup: React.FC<TaxRateGroupProps> = ({ taxRate, onChange, error }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <Icon name="percent" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
        <Text style={[styles.groupTitle, { color: COLORS.textPrimary }]}>Tax Rate</Text>
      </View>
      <View style={styles.container}>
        <ATMInput
          label="Standard Tax Percentage"
          value={taxRate}
          onChange={onChange}
          currency="%"
          error={error}
          placeholder="0.00"
        />
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  group: {
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  suffix: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default TaxRateGroup;
