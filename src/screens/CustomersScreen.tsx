import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppTheme } from '../theme/theme';

const CustomersScreen = () => {
  const theme = useTheme() as unknown as AppTheme;

  // Mock data
  const customers = [
    { id: '1', name: 'John Doe', visits: 12, spent: 245.50, lastVisit: '2 hours ago' },
    { id: '2', name: 'Jane Smith', visits: 8, spent: 120.00, lastVisit: 'Yesterday' },
    { id: '3', name: 'Mike Johnson', visits: 24, spent: 580.20, lastVisit: '3 days ago' },
    { id: '4', name: 'Sarah Wilson', visits: 3, spent: 45.00, lastVisit: '1 week ago' },
  ];

  const CustomerCard = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: theme.colors.onPrimary }]}>
            {item.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.lastVisit, { color: theme.colors.textSecondary }]}>Last seen: {item.lastVisit}</Text>
        </View>
        <TouchableOpacity>
          <Icon name="dots-vertical" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Visits</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{item.visits}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Spent</Text>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>${item.spent.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Customers</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                <Icon name="account-group" size={32} color={theme.colors.primary} />
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>1,240</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Customers</Text>
            </View>
             <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                <Icon name="star" size={32} color={theme.colors.accent} />
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>85</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>VIP Members</Text>
            </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Recent Activity</Text>
        {customers.map(customer => (
          <CustomerCard key={customer.id} item={customer} />
        ))}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCards: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24
  },
  summaryCard: {
      width: '48%',
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
  },
  summaryValue: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 8
  },
  summaryLabel: {
      fontSize: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastVisit: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomersScreen;
