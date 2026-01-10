import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { selectEstablishment, logoutAccount } from '../store/slices/authSlice';

interface Establishment {
  id: string;
  name: string;
  type: string;
  currency: string;
  subscriptionStatus: string;
  slug?: string;
}

const EstablishmentSelectorScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { account, establishments, isLoading } = useSelector((state: RootState) => state.auth);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectEstablishment = (establishment: Establishment) => {
    setSelectedId(establishment.id);
    dispatch(selectEstablishment(establishment));
  };

  const handleLogout = () => {
    dispatch(logoutAccount());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'trial':
        return { bg: '#FEF9C3', text: '#CA8A04' };
      case 'past_due':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trial':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'restaurant':
        return 'silverware-fork-knife';
      case 'cafe':
        return 'coffee';
      case 'bar':
        return 'glass-cocktail';
      case 'retail':
        return 'shopping';
      case 'bakery':
        return 'bread-slice';
      default:
        return 'store';
    }
  };

  const renderEstablishment = ({ item }: { item: Establishment }) => {
    const statusColors = getStatusColor(item.subscriptionStatus);
    const isSelected = selectedId === item.id;

    return (
      <TouchableOpacity
        style={[styles.establishmentCard, isSelected && styles.selectedCard]}
        onPress={() => handleSelectEstablishment(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
            <MaterialCommunityIcon
              name={getTypeIcon(item.type)}
              size={28}
              color={isSelected ? '#FFFFFF' : '#7CC39F'}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.establishmentName}>{item.name}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.establishmentType}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ')}
              </Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.currency}>{item.currency}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStatusLabel(item.subscriptionStatus)}
            </Text>
          </View>
          {isSelected ? (
            <MaterialCommunityIcon name="check-circle" size={24} color="#7CC39F" />
          ) : (
            <MaterialCommunityIcon name="chevron-right" size={24} color="#CBD5E1" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7CC39F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out" size={20} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcon name="store-check" size={32} color="#7CC39F" />
            </View>
            <Text style={styles.headerTitle}>Select Establishment</Text>
            <Text style={styles.headerSubtitle}>
              Choose which business to manage
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <View style={styles.accountAvatar}>
            <Text style={styles.avatarText}>
              {account?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountName}>
              {account?.firstName} {account?.lastName}
            </Text>
            <Text style={styles.accountEmail}>{account?.email}</Text>
          </View>
        </View>

        {/* Establishments List */}
        <FlatList
          data={establishments}
          renderItem={renderEstablishment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcon name="store-off" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Establishments</Text>
              <Text style={styles.emptyText}>
                You don't have any establishments yet. Please create one from the web dashboard.
              </Text>
            </View>
          }
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {establishments.length} establishment{establishments.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F1D2B',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7CC39F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1D2B',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  establishmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  selectedCard: {
    borderColor: '#7CC39F',
    backgroundColor: '#F0FDF4',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  selectedIconContainer: {
    backgroundColor: '#7CC39F',
  },
  cardInfo: {
    flex: 1,
  },
  establishmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1D2B',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  establishmentType: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  currency: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1D2B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default EstablishmentSelectorScreen;
