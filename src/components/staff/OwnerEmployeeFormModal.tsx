import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    Pressable
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface Establishment {
    id: string;
    name: string;
}

interface OwnerEmployeeFormData {
    id?: string;
    name: string;
    username: string;
    role: string;
    email?: string;
    permissions?: string[];
    establishmentIds?: string[];
}

interface OwnerEmployeeFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: OwnerEmployeeFormData | null;
    establishments: Establishment[];
}

const AVAILABLE_PERMISSIONS = [
    { id: 'pos', label: 'POS System', description: 'Access to sales screen' },
    { id: 'dashboard', label: 'Dashboard', description: 'View sales summary & analytics' },
    { id: 'reports', label: 'Reports', description: 'View sales reports' },
    { id: 'settings', label: 'Settings', description: 'App configuration' },
    { id: 'inventory', label: 'Inventory', description: 'Manage stock' },
    { id: 'refunds', label: 'Refunds', description: 'Process refunds' },
    { id: 'discounts', label: 'Discounts', description: 'Apply discounts' },
    { id: 'employees', label: 'Manage Employees', description: 'Add/Edit users' },
];

const OwnerEmployeeFormModal: React.FC<OwnerEmployeeFormModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialData,
    establishments
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [selectedEstablishmentIds, setSelectedEstablishmentIds] = useState<string[]>([]);
    const [establishmentSearch, setEstablishmentSearch] = useState('');

    const [loading, setLoading] = useState(false);
    const [showPermissionsDropdown, setShowPermissionsDropdown] = useState(false);
    const [showEstablishmentDropdown, setShowEstablishmentDropdown] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.name || '');
                setUsername(initialData.username || '');
                setEmail(initialData.email || '');
                setRole(initialData.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER');
                setPassword('');
                setConfirmPassword('');
                setPermissions(initialData.permissions || ['pos', 'discounts', 'refunds']);
                
                if (initialData.establishmentIds && initialData.establishmentIds.length > 0) {
                    setSelectedEstablishmentIds(initialData.establishmentIds);
                } else if (establishments.length === 1) {
                    setSelectedEstablishmentIds([establishments[0].id]);
                } else {
                    setSelectedEstablishmentIds([]);
                }
            } else {
                setName('');
                setUsername('');
                setEmail('');
                setRole('USER');
                setPassword('');
                setConfirmPassword('');
                setPermissions(['pos', 'discounts', 'refunds']);
                
                if (establishments.length === 1) {
                    setSelectedEstablishmentIds([establishments[0].id]);
                } else {
                    setSelectedEstablishmentIds([]);
                }
            }
            setLoading(false);
            setShowPermissionsDropdown(false);
            setShowEstablishmentDropdown(false);
            setEstablishmentSearch('');
        }
    }, [visible, initialData, establishments]);

    const togglePermission = (permissionId: string) => {
        setPermissions(prev => {
            const isRemoving = prev.includes(permissionId);
            let newPermissions = isRemoving
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];

            if (!isRemoving && (permissionId === 'discounts' || permissionId === 'refunds')) {
                if (!newPermissions.includes('pos')) newPermissions.push('pos');
            }
            return newPermissions;
        });
    };

    const toggleEstablishment = (establishmentId: string) => {
        setSelectedEstablishmentIds(prev =>
            prev.includes(establishmentId)
                ? prev.filter(id => id !== establishmentId)
                : [...prev, establishmentId]
        );
    };

    const filteredEstablishments = establishments.filter(est =>
        est.name.toLowerCase().includes(establishmentSearch.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!name || !username) {
            Alert.alert('Error', 'Please fill in Name and Username');
            return;
        }

        if (role === 'ADMIN' && !email) {
            Alert.alert('Error', 'Email is required for Admin users');
            return;
        }

        if (!initialData && !password) {
            Alert.alert('Error', 'Password is required for new employees');
            return;
        }

        if (password && password.length < 5) {
            Alert.alert('Error', 'Password must be at least 5 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (selectedEstablishmentIds.length === 0) {
            Alert.alert('Error', 'Please select at least one establishment');
            return;
        }

        setLoading(true);
        try {
            const nameParts = name.trim().split(/\s+/);
            const firstName = nameParts[0] || 'Staff';
            const lastName = nameParts.slice(1).join(' ');

            const payload: any = {
                firstName,
                ...(lastName && { lastName }),
                username: username.trim(),
                email: email.trim() || undefined,
                role: role.toUpperCase(),
                permissions: role === 'ADMIN' ? AVAILABLE_PERMISSIONS.map(p => p.id) : permissions,
                establishmentIds: selectedEstablishmentIds,
            };

            if (password) {
                payload.password = password;
            }

            if (!initialData) {
                payload.pinCode = Math.floor(1000 + Math.random() * 9000).toString();
            }

            await onSubmit(payload);
            onClose();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    style={styles.keyboardAvoidingView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>
                                    {initialData ? 'Edit Employee' : 'New Employee'}
                                </Text>
                                <Text style={styles.subtitle}>Manage Workforce Access</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={true}
                            bounces={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. John Doe"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                            </View>

                            {/* Username */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="e.g. johndoe"
                                    placeholderTextColor={COLORS.textTertiary}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Email {role === 'ADMIN' ? <Text style={styles.required}>*</Text> : '(Optional)'}
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="e.g. john@example.com"
                                    placeholderTextColor={COLORS.textTertiary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Establishment Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Access Locations <Text style={styles.required}>*</Text></Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
                                >
                                    <View style={styles.rowGap8}>
                                        <Icon name="map-marker-multiple" size={18} color={COLORS.primary} />
                                        <Text style={styles.dropdownButtonText}>
                                            {selectedEstablishmentIds.length === 0
                                                ? 'Select establishments...'
                                                : selectedEstablishmentIds.length === establishments.length
                                                    ? 'All Establishments'
                                                    : `${selectedEstablishmentIds.length} location${selectedEstablishmentIds.length === 1 ? '' : 's'} selected`}
                                        </Text>
                                    </View>
                                    <Icon
                                        name={showEstablishmentDropdown ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>

                                {showEstablishmentDropdown && (
                                    <View style={styles.dropdownList}>
                                        {/* Search */}
                                        <View style={styles.searchContainer}>
                                            <TextInput
                                                style={styles.searchInput}
                                                placeholder="Search locations..."
                                                placeholderTextColor={COLORS.textTertiary}
                                                value={establishmentSearch}
                                                onChangeText={setEstablishmentSearch}
                                            />
                                        </View>
                                        {/* List */}
                                        {filteredEstablishments.map(est => {
                                            const isSelected = selectedEstablishmentIds.includes(est.id);
                                            return (
                                                <TouchableOpacity
                                                    key={est.id}
                                                    style={[
                                                        styles.dropdownItem,
                                                        isSelected && { backgroundColor: COLORS.successBg }
                                                    ]}
                                                    onPress={() => toggleEstablishment(est.id)}
                                                >
                                                    <Text style={[
                                                        styles.dropdownItemText,
                                                        isSelected && { color: COLORS.primary, fontWeight: '700' }
                                                    ]}>
                                                        {est.name}
                                                    </Text>
                                                    {isSelected && (
                                                        <Icon name="check" size={16} color={COLORS.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                        {filteredEstablishments.length === 0 && (
                                            <Text style={styles.noResults}>No locations found</Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Role Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Role <Text style={styles.required}>*</Text></Text>
                                <View style={[styles.roleSelector, { borderColor: COLORS.border, backgroundColor: COLORS.white }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleButton,
                                            role === 'ADMIN' && [styles.roleButtonActive, { backgroundColor: COLORS.primary }],
                                        ]}
                                        onPress={() => setRole('ADMIN')}
                                    >
                                        <Text
                                            style={[
                                                styles.roleButtonText,
                                                { color: COLORS.textSecondary },
                                                role === 'ADMIN' && [styles.roleButtonTextActive, { color: COLORS.white }],
                                            ]}
                                        >
                                            Admin
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleButton,
                                            role === 'USER' && [styles.roleButtonActive, { backgroundColor: COLORS.primary }],
                                        ]}
                                        onPress={() => setRole('USER')}
                                    >
                                        <Text
                                            style={[
                                                styles.roleButtonText,
                                                { color: COLORS.textSecondary },
                                                role === 'USER' && [styles.roleButtonTextActive, { color: COLORS.white }],
                                            ]}
                                        >
                                            User
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Permissions Section */}
                            {role === 'USER' && (
                                <View style={styles.permissionsContainer}>
                                    <Text style={[styles.label, { color: COLORS.textSecondary }]}>Permissions</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowPermissionsDropdown(!showPermissionsDropdown)}
                                    >
                                        <View style={styles.rowGap8}>
                                            <Icon name="shield-check" size={18} color={COLORS.primary} />
                                            <Text style={styles.dropdownButtonText}>
                                                {permissions.length} selected
                                            </Text>
                                        </View>
                                        <Icon
                                            name={showPermissionsDropdown ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>

                                    {showPermissionsDropdown && (
                                        <View style={styles.dropdownList}>
                                            {AVAILABLE_PERMISSIONS.map((perm) => {
                                                const isLocked = perm.id === 'pos' && (permissions.includes('refunds') || permissions.includes('discounts'));
                                                return (
                                                    <TouchableOpacity
                                                        key={perm.id}
                                                        style={[styles.dropdownItem, { opacity: isLocked ? 0.7 : 1 }]}
                                                        onPress={() => !isLocked && togglePermission(perm.id)}
                                                    >
                                                        <View style={styles.flex1}>
                                                            <Text style={[
                                                                styles.dropdownItemText,
                                                                { fontWeight: permissions.includes(perm.id) ? '700' : '400' }
                                                            ]}>
                                                                {perm.label}
                                                            </Text>
                                                            <Text style={[styles.descriptionText, { color: COLORS.textTertiary }]}>
                                                                {perm.description}
                                                            </Text>
                                                        </View>
                                                        {permissions.includes(perm.id) && (
                                                            <Icon name={isLocked ? "lock" : "check"} size={16} color={COLORS.primary} />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Password Section */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {initialData ? 'Change Password' : 'Password'}
                                    {!initialData && <Text style={styles.required}> *</Text>}
                                    {initialData && ' (Leave blank to keep current)'}
                                </Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Min 5 characters"
                                        placeholderTextColor={COLORS.textTertiary}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={[styles.eyeButton, { backgroundColor: COLORS.background, borderColor: COLORS.border }]}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm password"
                                    placeholderTextColor={COLORS.textTertiary}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: COLORS.border }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.cancelButtonText, { color: COLORS.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: COLORS.primary }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {initialData ? 'Save Changes' : 'Add Employee'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardAvoidingView: {
        width: '100%',
        maxWidth: 600,
        flex: 1,
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 32,
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 0,
        width: '100%',
        maxHeight: '90%',
        minHeight: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 24,
        overflow: 'hidden',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {},
    scrollContent: {
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    permissionsContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    required: {
        color: colors.error,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    roleSelector: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        padding: 4,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    roleButtonActive: {},
    roleButtonText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    roleButtonTextActive: {
        fontWeight: '800',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eyeButton: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    dropdownButton: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    dropdownList: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        marginTop: 8,
        paddingVertical: 4,
        maxHeight: 200,
        elevation: 5,
        zIndex: 10,
    },
    searchContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchInput: {
        backgroundColor: colors.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: colors.textPrimary,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginHorizontal: 4,
        marginVertical: 2,
    },
    dropdownItemText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    noResults: {
        textAlign: 'center',
        padding: 16,
        color: colors.textTertiary,
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    cancelButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    submitButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rowGap8: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    flex1: {
        flex: 1,
    },
    descriptionText: {
        fontSize: 11,
        marginTop: 2,
    },
    passwordInput: {
        flex: 1,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
});

export default OwnerEmployeeFormModal;
