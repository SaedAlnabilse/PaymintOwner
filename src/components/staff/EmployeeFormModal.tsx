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
import { CreateUserDto, UpdateUserDto } from '../../services/users';
import { Discount } from '../../types/salesManagement';

interface StaffMember {
    id: string;
    name: string;
    username: string;
    role: string;
    email?: string;
    employeeId?: string;
    permissions?: string[];
    allowedDiscounts?: string[];
}

interface EmployeeFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: StaffMember | null;
    availableDiscounts?: Discount[];
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

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
    visible,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    availableDiscounts = []
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

    const [loading, setLoading] = useState(false);
    const [showPermissionsDropdown, setShowPermissionsDropdown] = useState(true);
    const [showDiscountsDropdown, setShowDiscountsDropdown] = useState(false);

    // Permission & Discount State
    const [permissions, setPermissions] = useState<string[]>([]);
    const [allowedDiscounts, setAllowedDiscounts] = useState<string[]>([]);
    const [allDiscountsSelected, setAllDiscountsSelected] = useState(true);

    const discountsForUser = role === 'ADMIN'
        ? availableDiscounts
        : availableDiscounts.filter(d => !d.adminOnly);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.name || '');
                setUsername(initialData.username || '');
                setEmail(initialData.email || '');
                setRole(initialData.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER');
                setPassword('');
                setConfirmPassword('');

                // Initialize Permissions
                setPermissions(initialData.permissions || ['pos']);

                // Initialize Discounts
                if (initialData.allowedDiscounts && initialData.allowedDiscounts.length > 0) {
                    setAllDiscountsSelected(false);
                    setAllowedDiscounts(initialData.allowedDiscounts);
                } else {
                    setAllDiscountsSelected(true);
                    setAllowedDiscounts([]);
                }
            } else {
                setName('');
                setUsername('');
                setEmail('');
                setRole('USER');
                setPassword('');
                setConfirmPassword('');
                setPermissions(['pos']);
                setAllDiscountsSelected(true);
                setAllowedDiscounts([]);
            }
            setLoading(false);
        }
    }, [visible, initialData]);

    const togglePermission = (permissionId: string) => {
        setPermissions(prev => {
            const isRemoving = prev.includes(permissionId);
            let newPermissions = isRemoving
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];

            if (!isRemoving && (permissionId === 'discounts' || permissionId === 'refunds')) {
                if (!newPermissions.includes('pos')) newPermissions.push('pos');
            }
            if (isRemoving && (permissionId === 'discounts' || permissionId === 'refunds')) {
                if (!newPermissions.includes('discounts') && !newPermissions.includes('refunds')) {
                    // newPermissions = newPermissions.filter(id => id !== 'pos'); // Optional: force keep POS
                }
            }
            return newPermissions;
        });
    };

    const toggleDiscount = (discountId: string) => {
        setAllowedDiscounts(prev =>
            prev.includes(discountId)
                ? prev.filter(id => id !== discountId)
                : [...prev, discountId]
        );
    };

    const handleAllDiscountsToggle = (value: boolean) => {
        setAllDiscountsSelected(value);
        if (value) setAllowedDiscounts([]);
    };

    const handleSubmit = async () => {
        if (!name || !username || !role) {
            Alert.alert('Error', 'Please fill in Name, Username and Role');
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

        setLoading(true);
        try {
            const payload: any = {
                name: name.trim(),
                username: username.trim(),
                employeeId: initialData?.employeeId || `EMP${Date.now().toString().slice(-6)}`, // Keep ID for backend but hide from UI
                email: email.trim() || undefined,
                role: role.toUpperCase(),
                permissions: role === 'ADMIN' ? AVAILABLE_PERMISSIONS.map(p => p.id) : permissions,
                allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
            };

            if (password) {
                payload.password = password;
            }

            if (!initialData) {
                // New employee: random 4-digit PIN as per main app pattern
                payload.pinCode = Math.floor(1000 + Math.random() * 9000).toString();
            }

            await onSubmit(payload);
            onClose();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save employee');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!initialData?.id || !onDelete) return;

        Alert.alert(
            'Delete Employee',
            'Are you sure you want to delete this employee? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await onDelete(initialData.id);
                            onClose();
                        } catch {
                            Alert.alert('Error', 'Failed to delete employee');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
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
                            <Text style={styles.title}>{initialData ? 'Edit Employee' : 'New Employee'}</Text>
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
                                <Text style={styles.label}>Full Name</Text>
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
                                <Text style={styles.label}>Username</Text>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="e.g. johndoe"
                                    placeholderTextColor={COLORS.textTertiary}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Email (Optional) */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email (Optional)</Text>
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

                            {/* Role Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Role</Text>
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

                            {/* PERMISSIONS SECTION */}
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
                                        <Icon name={showPermissionsDropdown ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
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
                                                            <Text style={[styles.dropdownItemText, { fontWeight: permissions.includes(perm.id) ? '700' : '400' }]}>
                                                                {perm.label}
                                                            </Text>
                                                            <Text style={[styles.descriptionText, { color: COLORS.textTertiary }]}>{perm.description}</Text>
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

                            {/* DISCOUNT SELECTION */}
                            {role === 'USER' && permissions.includes('discounts') && discountsForUser.length > 0 && (
                                <View style={styles.permissionsContainer}>
                                    <Text style={[styles.label, { color: COLORS.textSecondary }]}>Allowed Discounts</Text>

                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => handleAllDiscountsToggle(!allDiscountsSelected)}
                                    >
                                        <View style={styles.rowGap8}>
                                            <Icon name="tag-multiple" size={18} color={COLORS.primary} />
                                            <Text style={styles.dropdownButtonText}>
                                                {allDiscountsSelected ? 'All Discounts Allowed' : `${allowedDiscounts.length} Selected`}
                                            </Text>
                                        </View>
                                        {allDiscountsSelected && <Icon name="check" size={16} color={COLORS.primary} />}
                                    </TouchableOpacity>

                                    {!allDiscountsSelected && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.dropdownButton, styles.marginTop8]}
                                                onPress={() => setShowDiscountsDropdown(!showDiscountsDropdown)}
                                            >
                                                <Text style={styles.dropdownButtonText}>Select Specific Discounts</Text>
                                                <Icon name={showDiscountsDropdown ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
                                            </TouchableOpacity>

                                            {showDiscountsDropdown && (
                                                <View style={styles.dropdownList}>
                                                    {discountsForUser.map((discount) => (
                                                        <TouchableOpacity
                                                            key={discount.id}
                                                            style={styles.dropdownItem}
                                                            onPress={() => toggleDiscount(discount.id)}
                                                        >
                                                            <View style={styles.flex1}>
                                                                <Text style={[styles.dropdownItemText, { fontWeight: allowedDiscounts.includes(discount.id) ? '700' : '400' }]}>
                                                                    {discount.name}
                                                                </Text>
                                                                <Text style={[styles.descriptionText, { color: COLORS.textTertiary }]}>
                                                                    {(discount.percentage * 100).toFixed(0)}% Off
                                                                </Text>
                                                            </View>
                                                            {allowedDiscounts.includes(discount.id) && (
                                                                <Icon name="check" size={16} color={COLORS.primary} />
                                                            )}
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}

                            {/* Password Section */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {initialData ? 'Change Password' : 'Password'} {initialData && '(Leave blank to keep current)'}
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
                            {initialData && onDelete && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={handleDelete}
                                    disabled={loading}
                                >
                                    <Icon name="trash-can-outline" size={24} color={COLORS.error} />
                                </TouchableOpacity>
                            )}

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
                                        {initialData ? 'Save' : 'Add'}
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
        paddingTop: 12, // Reduced for handle
        paddingHorizontal: 24,
        paddingBottom: 0,
        width: '100%',
        maxHeight: '85%',
        minHeight: 400, // Ensure it doesn't look tiny
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
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        // flex: 1 removed to allow self-sizing
    },
    scrollContent: {
        paddingBottom: 20,
    },
    formContainer: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    permissionsContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.textPrimary,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    roleSelector: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    roleButtonActive: {
        // dynamic
    },
    roleButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    roleButtonTextActive: {
        fontWeight: '700',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eyeButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    dropdownButton: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 15,
        color: colors.textPrimary,
    },
    dropdownList: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        marginTop: -12,
        marginBottom: 16,
        paddingVertical: 4,
        elevation: 5,
        zIndex: 10,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    dropdownItemText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    deleteButton: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: colors.errorBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
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
    },
    marginTop8: {
        marginTop: 8,
    },
    passwordInput: {
        flex: 1,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
});

export default EmployeeFormModal;
