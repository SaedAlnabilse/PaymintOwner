import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const LogoHeader = () => {
  return (
    <View style={styles.headerSection}>
      <Image
        source={require('../../assets/images/Logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.appTitle}>PayMint Owner</Text>
      <Text style={styles.appSubtitle}>Monitor Your Business Anywhere</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 16,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7CC39F',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
});

export default LogoHeader;
