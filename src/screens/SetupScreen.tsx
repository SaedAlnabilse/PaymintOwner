import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RNCamera } from 'react-native-camera';
import { AppSettingsService } from '../services/AppSettingsService';
import { updateApiClientUrl } from '../services/apiClient';
import { setApiUrl, DEFAULT_PRODUCTION_URL } from '../config/api.config';

// Define navigation types since we might not have global types yet
type RootStackParamList = {
  Setup: undefined;
  Login: undefined;
  TenantSelection: undefined;
};

type SetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Setup'>;

const SetupScreen = () => {
  const navigation = useNavigation<SetupScreenNavigationProp>();
  const [apiUrl, setApiUrlInput] = useState('');
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Camera State
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const storedUrl = await AppSettingsService.getApiUrl();
      const storedId = await AppSettingsService.getStoreId();
      
      if (storedUrl) {
        setApiUrlInput(storedUrl);
      } else {
        setApiUrlInput(DEFAULT_PRODUCTION_URL);
      }
      
      if (storedId) {
        setStoreId(storedId);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQr = () => {
    setIsScanning(true);
  };

  const onBarCodeRead = (e: any) => {
    if (!isScanning) return;

    try {
      const rawData = e.data;
      console.log('QR Code Scanned:', rawData);

      let scannedUrl = '';
      let scannedStoreId = '';

      if (rawData.startsWith('{')) {
        const parsed = JSON.parse(rawData);
        scannedUrl = parsed.apiUrl || parsed.url || '';
        scannedStoreId = parsed.storeId || '';
      } else if (rawData.startsWith('http')) {
        scannedUrl = rawData;
      } else {
        Alert.alert('Invalid QR Code', 'This QR code does not contain a valid URL or configuration.');
        setIsScanning(false);
        return;
      }

      if (scannedUrl) {
        setApiUrlInput(scannedUrl);
        if (scannedStoreId) setStoreId(scannedStoreId);
        setIsScanning(false);
        Alert.alert('Scanned!', 'Server configuration loaded from QR code.');
      }
    } catch (error) {
      console.error('QR Parse Error:', error);
      Alert.alert('Error', 'Failed to parse QR code data.');
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid API URL');
      return;
    }

    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      await AppSettingsService.setSettings(apiUrl.trim(), storeId.trim());
      setApiUrl(apiUrl.trim());
      updateApiClientUrl(apiUrl.trim());

      Alert.alert(
        'Success', 
        'Configuration saved successfully. Connecting to server...',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to TenantSelection
              navigation.replace('TenantSelection'); 
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setApiUrlInput(DEFAULT_PRODUCTION_URL);
    setStoreId('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7CC39F" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconContainer}>
            <Icon name="server-network" size={48} color="#7CC39F" />
          </View>
          <Text style={styles.title}>Owner Setup</Text>
          <Text style={styles.subtitle}>Connect to your Paymint Server</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Server URL</Text>
            <View style={styles.inputWrapper}>
              <Icon name="web" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrlInput}
                placeholder="https://api.paymint.app"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <Text style={styles.helperText}>
              Enter the full address of your Paymint backend server.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store ID (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Icon name="store" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={storeId}
                onChangeText={setStoreId}
                placeholder="e.g. cafe-aroma-001"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleScanQr}
            activeOpacity={0.8}
          >
            <Icon name="qrcode-scan" size={24} color="#FFF" />
            <Text style={styles.scanButtonText}>Scan Setup QR Code</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset Default</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save & Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Paymint Owner v2.0.0</Text>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={isScanning}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsScanning(false)}
      >
        <View style={styles.cameraContainer}>
          <RNCamera
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.auto}
            captureAudio={false}
            onBarCodeRead={onBarCodeRead}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera for scanning QR codes',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.closeCameraButton}>
                  <Icon name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>Scan QR Code</Text>
                <View style={{ width: 28 }} />
              </View>
              
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstruction}>Align the QR code within the frame</Text>
            </View>
          </RNCamera>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1E293B',
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 16,
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7CC39F', // Owner App Primary Green
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 24,
  },
  
  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeCameraButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  scanInstruction: {
    color: '#FFF',
    marginTop: 20,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default SetupScreen;
