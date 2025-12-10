import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppTheme } from '../theme/theme';

const PromotionsScreen = () => {
  const theme = useTheme() as unknown as AppTheme;

  const promotions = [
    { id: '1', title: 'Happy Hour', discount: '20% OFF', active: true, days: 'Mon-Fri', time: '5pm-7pm' },
    { id: '2', title: 'Lunch Special', discount: '15% OFF', active: true, days: 'Daily', time: '11am-2pm' },
    { id: '3', title: 'Summer Sale', discount: '10% OFF', active: false, days: 'All Day', time: '' },
  ];

  const PromotionCard = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <View>
           <Text style={[styles.promoTitle, { color: theme.colors.text }]}>{item.title}</Text>
           <Text style={[styles.promoDiscount, { color: theme.colors.primary }]}>{item.discount}</Text>
        </View>
        <Switch 
          value={item.active}
          trackColor={{ false: theme.colors.background, true: theme.colors.primary }}
          thumbColor="#FFF"
        />
      </View>
      
      <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
          <View style={styles.scheduleItem}>
              <Icon name="calendar-clock" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.scheduleText, { color: theme.colors.textSecondary }]}>{item.days} {item.time}</Text>
          </View>
          <TouchableOpacity>
              <Icon name="pencil" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Promotions</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.alertBox, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
            <Icon name="information-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.alertText, { color: theme.colors.text }]}>Active promotions are automatically applied at checkout based on the schedule.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Campaigns</Text>
        {promotions.map(promo => (
          <PromotionCard key={promo.id} item={promo} />
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
  alertBox: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 24,
      alignItems: 'center',
      gap: 12
  },
  alertText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20
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
    marginBottom: 16,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20
  },
  promoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4
  },
  promoDiscount: {
      fontSize: 14,
      fontWeight: 'bold'
  },
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderTopWidth: 1
  },
  scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
  },
  scheduleText: {
      fontSize: 13
  }
});

export default PromotionsScreen;
