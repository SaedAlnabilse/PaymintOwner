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
    Pressable,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { CreateUserDto, UpdateUserDto } from '../../services/users';
import { Discount } from '../../types/salesManagement';
import { getCustomRoles, CustomRole } from '../../services/customRoles';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface StaffMember {
    id: string;
    name: string;
    username: string;
    role: string;
    email?: string;
    employeeId?: string;
    permissions?: string[];
    allowedDiscounts?: string[];
    customRoleId?: string;
    posAccess?: boolean;
    backofficeAccess?: boolean;
    backofficePermissions?: string[];
}

interface EmployeeFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: StaffMember | null;
    availableDiscounts?: Discount[];
    establishmentId?: string;
}

const POS_PERMISSIONS = [
    { id: 'pos', label: 'POS System', description: 'Access to sales screen' },
    { id: 'dashboard', label: 'Dashboard', description: 'View sales summary & analytics' },
    { id: 'reports', label: 'Reports', description: 'View sales reports' },
    { id: 'settings', label: 'Settings', description: 'App configuration' },
    { id: 'inventory', label: 'Inventory', description: 'Manage stock' },
    { id: 'refunds', label: 'Refunds', description: 'Process refunds' },
    { id: 'discounts', label: 'Discounts', description: 'Apply discounts' },
    { id: 'employees', label: 'Manage Employees', description: 'Add/Edit users' },
];

const BACKOFFICE_PERMISSIONS = [
    { id: 'view_reports', label: 'View sales reports', description: 'Access dashboard and analytics' },
    { id: 'manage_items', label: 'Manage items', description: 'Create and edit products and inventory' },
    { id: 'view_cost', label: 'View cost of items', description: 'See profit margins and costs' },
    { id: 'manage_employees', label: 'Manage employees', description: 'Add/edit staff and roles' },
    { id: 'manage_customers', label: 'Manage customers', description: 'View and edit customer database' },
    { id: 'manage_settings', label: 'Manage feature settings', description: 'General store configuration' },
    { id: 'manage_billing', label: 'Manage billing', description: 'Subscription and payment methods' },
    { id: 'manage_payment_types', label: 'Manage payment types', description: 'Configure payment options' },
    { id: 'manage_loyalty', label: 'Manage loyalty program', description: 'Configure points and rewards' },
    { id: 'manage_taxes', label: 'Manage taxes', description: 'Tax rates and settings' },
    { id: 'manage_devices', label: 'Manage POS devices', description: 'Add or remove POS registers' },
];

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
    visible,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    availableDiscounts = [],
    establishmentId
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    // Form State
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Access Control State
    const [posAccess, setPosAccess] = useState(true);
    const [backofficeAccess, setBackofficeAccess] = useState(false);

    // Permissions State
    const [permissions, setPermissions] = useState<string[]>([]); // POS Permissions
    const [backofficePermissions, setBackofficePermissions] = useState<string[]>([]); // Back Office Permissions

    // Discount State
    const [allowedDiscounts, setAllowedDiscounts] = useState<string[]>([]);
    const [allDiscountsSelected, setAllDiscountsSelected] = useState(true);

    // Custom Roles State
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
    const [selectedCustomRoleId, setSelectedCustomRoleId] = useState<string>('');
    const [lastAppliedTemplate, setLastAppliedTemplate] = useState<CustomRole | null>(null);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    // Advanced Mode State
    const [showAdvanced, setShowAdvanced] = useState(false);

    // UI State
    const [loading, setLoading] = useState(false);
    const [showRolesDropdown, setShowRolesDropdown] = useState(false);
    const [showDiscountsDropdown, setShowDiscountsDropdown] = useState(false);

    const discountsForUser = role === 'ADMIN'
        ? availableDiscounts
        : availableDiscounts.filter(d => !d.adminOnly);

    // Fetch custom roles
    const fetchCustomRoles = async () => {
        if (!establishmentId) return;
        setIsLoadingRoles(true);
        try {
            const roles = await getCustomRoles(establishmentId);
            setCustomRoles(roles || []);
        } catch (error) {
            console.error('Failed to load custom roles', error);
        } finally {
            setIsLoadingRoles(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchCustomRoles();
            if (initialData) {
                // Edit Mode
                setName(initialData.name || '');
                setUsername(initialData.username || '');
                setEmail(initialData.email || '');
                setRole(initialData.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER');
                setPassword('');
                setConfirmPassword('');

                // Access Control
                setPosAccess(initialData.posAccess !== false); // Default true
                setBackofficeAccess(initialData.backofficeAccess || false);

                // Permissions
                setPermissions(initialData.permissions || ['pos', 'discounts', 'refunds']);
                setBackofficePermissions(initialData.backofficePermissions || []);

                // Discounts
                if (initialData.allowedDiscounts && initialData.allowedDiscounts.length > 0) {
                    setAllDiscountsSelected(false);
                    setAllowedDiscounts(initialData.allowedDiscounts);
                } else {
                    setAllDiscountsSelected(true);
                    setAllowedDiscounts([]);
                }

                // Custom Role
                setSelectedCustomRoleId(initialData.customRoleId || '');
            } else {
                // Add Mode - Defaults
                setName('');
                setUsername('');
                setEmail('');
                setRole('USER');
                setPassword('');
                setConfirmPassword('');
                setPosAccess(true);
                setBackofficeAccess(false);
                setPermissions(['pos', 'discounts', 'refunds']);
                setBackofficePermissions([]);
                setAllDiscountsSelected(true);
                setAllowedDiscounts([]);
                setSelectedCustomRoleId('');
                setLastAppliedTemplate(null);
            }
            setLoading(false);
            setShowRolesDropdown(false);
            setShowDiscountsDropdown(false);
        }
    }, [visible, initialData, establishmentId]);

    const handleTemplateSelect = (roleTemplate: CustomRole) => {
        setRole('USER'); // Custom roles are always based on USER permissions model
        setPermissions(roleTemplate.permissions);
        setBackofficePermissions(roleTemplate.backofficePermissions || []);

        // Sync access control
        setPosAccess(roleTemplate.posAccess !== false);
        setBackofficeAccess(roleTemplate.backofficeAccess || false);

        // Sync discounts
        if (roleTemplate.allowedDiscounts && roleTemplate.allowedDiscounts.length > 0) {
            setAllDiscountsSelected(false);
            setAllowedDiscounts(roleTemplate.allowedDiscounts);
        } else {
            setAllDiscountsSelected(roleTemplate.allDiscounts);
            setAllowedDiscounts([]);
        }

        setSelectedCustomRoleId(roleTemplate.id);
        setLastAppliedTemplate(roleTemplate);
        setShowRolesDropdown(false);
    };

    const togglePermission = (permissionId: string) => {
        setPermissions(prev => {
            const isRemoving = prev.includes(permissionId);
            let newPermissions = isRemoving
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];

            // Auto-enable POS if discounts/refunds selected
            if (!isRemoving && (permissionId === 'discounts' || permissionId === 'refunds')) {
                if (!newPermissions.includes('pos')) newPermissions.push('pos');
            }
            return newPermissions;
        });
    };

    const toggleBackofficePermission = (permissionId: string) => {
        setBackofficePermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const toggleDiscount = (discountId: string) => {
        setAllowedDiscounts(prev =>
            prev.includes(discountId)
                ? prev.filter(id => id !== discountId)
                : [...prev, discountId]
        );
    };

    const handleAllDiscountsToggle = () => {
        if (allDiscountsSelected) {
            setAllDiscountsSelected(false);
            setAllowedDiscounts([]);
        } else {
            setAllDiscountsSelected(true);
            setAllowedDiscounts([]);
        }
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
                employeeId: initialData?.employeeId || `EMP${Date.now().toString().slice(-6)}`,
                email: email.trim() || undefined,
                role: role.toUpperCase(),
                permissions: role === 'ADMIN' ? POS_PERMISSIONS.map(p => p.id) : permissions,
                allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
                customRoleId: selectedCustomRoleId || undefined,
                posAccess,
                backofficeAccess,
                backofficePermissions: backofficeAccess ? backofficePermissions : [],
            };

            if (password) {
                payload.password = password;
            }

            if (!initialData) {
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

                            {/* Email */}
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

                            {/* Role Template Selection */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Role</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setShowRolesDropdown(!showRolesDropdown)}
                                >
                                    <Text style={styles.dropdownButtonText}>
                                        {role === 'ADMIN'
                                            ? 'Admin (Full Access)'
                                            : selectedCustomRoleId
                                                ? customRoles.find(r => r.id === selectedCustomRoleId)?.name || 'Select Role'
                                                : 'Select Role'}
                                    </Text>
                                    <Icon name={showRolesDropdown ? "chevron-up" : "chevron-down"} size={24} color={COLORS.textSecondary} />
                                </TouchableOpacity>

                                {showRolesDropdown && (
                                    <View style={styles.dropdownList}>
                                        {/* Admin Option */}
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setRole('ADMIN');
                                                setSelectedCustomRoleId('');
                                                setPosAccess(true);
                                                setBackofficeAccess(true);
                                                setPermissions(POS_PERMISSIONS.map(p => p.id));
                                                setBackofficePermissions(BACKOFFICE_PERMISSIONS.map(p => p.id));
                                                setAllDiscountsSelected(true);
                                                setShowRolesDropdown(false);
                                                setShowAdvanced(true); // Reveal settings for Admin so they see they have full access
                                            }}
                                        >
                                            <View style={{flex: 1}}>
                                                <Text style={[styles.dropdownItemText, {color: COLORS.primary, fontWeight: '700'}]}>Admin (Full Access)</Text>
                                                <Text style={styles.descriptionText}>All permissions enabled</Text>
                                            </View>
                                            {role === 'ADMIN' && <Icon name="check" size={20} color={COLORS.primary} />}
                                        </TouchableOpacity>

                                        <View style={{height: 1, backgroundColor: COLORS.border, marginVertical: 4}} />

                                        {/* Custom Roles */}
                                        {customRoles.map((cr) => (
                                            <TouchableOpacity
                                                key={cr.id}
                                                style={styles.dropdownItem}
                                                onPress={() => handleTemplateSelect(cr)}
                                            >
                                                <View style={{flex: 1}}>
                                                    <Text style={styles.dropdownItemText}>{cr.name}</Text>
                                                    <Text style={styles.descriptionText}>{cr.permissions.length} permissions</Text>
                                                </View>
                                                {selectedCustomRoleId === cr.id && role !== 'ADMIN' && (
                                                    <Icon name="check" size={20} color={COLORS.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))}

                                        {customRoles.length === 0 && (
                                            <View style={{padding: 12, alignItems: 'center'}}>
                                                <Text style={{color: COLORS.textTertiary, fontSize: 13}}>No custom roles found</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Advanced Settings Toggle */}
                            <TouchableOpacity
                                style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => setShowAdvanced(!showAdvanced)}
                            >
                                <Icon name={showAdvanced ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
                                <Text style={[styles.label, { marginBottom: 0, marginLeft: 8 }]}>
                                    {showAdvanced ? 'Hide Advanced Access Settings' : 'Show Advanced Access Settings'}
                                </Text>
                            </TouchableOpacity>

                            {/* PLATFORM ACCESS CONTROLS (Only for Non-Admin) */}
                            {showAdvanced && role !== 'ADMIN' && (
                                <>
                                    {/* POS Access Section */}
                                    <View style={[styles.sectionContainer, {borderColor: COLORS.border}]}>
                                        <TouchableOpacity
                                            style={[styles.sectionHeader, {borderBottomWidth: posAccess ? 1 : 0, borderBottomColor: COLORS.border}]}
                                            onPress={() => setPosAccess(!posAccess)}
                                        >
                                            <View style={styles.rowGap8}>
                                                <View style={[styles.iconCircle, {backgroundColor: posAccess ? COLORS.primary + '20' : COLORS.background}]}>
                                                    <Icon name="cellphone" size={20} color={posAccess ? COLORS.primary : COLORS.textTertiary} />
                                                </View>
                                                <View>
                                                    <Text style={styles.sectionTitle}>POS Access</Text>
                                                    <Text style={styles.sectionSubtitle}>Log in to POS app using PIN</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.toggle, {backgroundColor: posAccess ? COLORS.primary : COLORS.border}]}>
                                                <View style={[styles.toggleKnob, {transform: [{translateX: posAccess ? 20 : 2}]}]} />
                                            </View>
                                        </TouchableOpacity>

                                        {posAccess && (
                                            <View style={styles.sectionContent}>
                                                {POS_PERMISSIONS.map(perm => (
                                                    <TouchableOpacity
                                                        key={perm.id}
                                                        style={styles.permissionItem}
                                                        onPress={() => togglePermission(perm.id)}
                                                    >
                                                        <View style={{flex: 1}}>
                                                            <Text style={[styles.permLabel, permissions.includes(perm.id) && {color: COLORS.primary, fontWeight: '600'}]}>{perm.label}</Text>
                                                            <Text style={styles.permDesc}>{perm.description}</Text>
                                                        </View>
                                                        <View style={[styles.checkbox, permissions.includes(perm.id) && {backgroundColor: COLORS.primary, borderColor: COLORS.primary}]}>
                                                            {permissions.includes(perm.id) && <Icon name="check" size={14} color="#FFF" />}
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}

                                                {/* Discounts Subsection */}
                                                {permissions.includes('discounts') && (
                                                    <View style={[styles.subSection, {borderTopColor: COLORS.border}]}>
                                                        <TouchableOpacity
                                                            style={styles.subSectionHeader}
                                                            onPress={() => setShowDiscountsDropdown(!showDiscountsDropdown)}
                                                        >
                                                            <Text style={styles.subSectionTitle}>Allowed Discounts</Text>
                                                            <View style={styles.rowGap8}>
                                                                <Text style={styles.subSectionStatus}>
                                                                    {allDiscountsSelected ? 'All Allowed' : `${allowedDiscounts.length} Selected`}
                                                                </Text>
                                                                <Icon name={showDiscountsDropdown ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
                                                            </View>
                                                        </TouchableOpacity>

                                                        {showDiscountsDropdown && (
                                                            <View style={styles.subSectionContent}>
                                                                <TouchableOpacity
                                                                    style={styles.permissionItem}
                                                                    onPress={handleAllDiscountsToggle}
                                                                >
                                                                    <Text style={styles.permLabel}>Allow all discounts</Text>
                                                                    <View style={[styles.checkbox, allDiscountsSelected && {backgroundColor: COLORS.primary, borderColor: COLORS.primary}]}>
                                                                        {allDiscountsSelected && <Icon name="check" size={14} color="#FFF" />}
                                                                    </View>
                                                                </TouchableOpacity>

                                                                {!allDiscountsSelected && discountsForUser.map(discount => (
                                                                    <TouchableOpacity
                                                                        key={discount.id}
                                                                        style={[styles.permissionItem, {paddingLeft: 16}]}
                                                                        onPress={() => toggleDiscount(discount.id)}
                                                                    >
                                                                        <View>
                                                                            <Text style={styles.permLabel}>{discount.name}</Text>
                                                                            <Text style={styles.permDesc}>{discount.percentage * 100}% Off</Text>
                                                                        </View>
                                                                        <View style={[styles.checkbox, allowedDiscounts.includes(discount.id) && {backgroundColor: COLORS.primary, borderColor: COLORS.primary}]}>
                                                                            {allowedDiscounts.includes(discount.id) && <Icon name="check" size={14} color="#FFF" />}
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    {/* Back Office Access Section */}
                                    <View style={[styles.sectionContainer, {borderColor: COLORS.border, marginTop: 16}]}>
                                        <TouchableOpacity
                                            style={[styles.sectionHeader, {borderBottomWidth: backofficeAccess ? 1 : 0, borderBottomColor: COLORS.border}]}
                                            onPress={() => setBackofficeAccess(!backofficeAccess)}
                                        >
                                            <View style={styles.rowGap8}>
                                                <View style={[styles.iconCircle, {backgroundColor: backofficeAccess ? COLORS.primary + '20' : COLORS.background}]}>
                                                    <Icon name="monitor-dashboard" size={20} color={backofficeAccess ? COLORS.primary : COLORS.textTertiary} />
                                                </View>
                                                <View>
                                                    <Text style={styles.sectionTitle}>Back Office Access</Text>
                                                    <Text style={styles.sectionSubtitle}>Log in to dashboard using email</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.toggle, {backgroundColor: backofficeAccess ? COLORS.primary : COLORS.border}]}>
                                                <View style={[styles.toggleKnob, {transform: [{translateX: backofficeAccess ? 20 : 2}]}]} />
                                            </View>
                                        </TouchableOpacity>

                                        {backofficeAccess && (
                                            <View style={styles.sectionContent}>
                                                {BACKOFFICE_PERMISSIONS.map(perm => (
                                                    <TouchableOpacity
                                                        key={perm.id}
                                                        style={styles.permissionItem}
                                                        onPress={() => toggleBackofficePermission(perm.id)}
                                                    >
                                                        <View style={{flex: 1}}>
                                                            <Text style={[styles.permLabel, backofficePermissions.includes(perm.id) && {color: COLORS.primary, fontWeight: '600'}]}>{perm.label}</Text>
                                                            <Text style={styles.permDesc}>{perm.description}</Text>
                                                        </View>
                                                        <View style={[styles.checkbox, backofficePermissions.includes(perm.id) && {backgroundColor: COLORS.primary, borderColor: COLORS.primary}]}>
                                                            {backofficePermissions.includes(perm.id) && <Icon name="check" size={14} color="#FFF" />}
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}

                            {/* Password Section */}
                            <View style={[styles.inputGroup, {marginTop: 20}]}>
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
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 0,
        width: '100%',
        maxHeight: '90%', // Increased height
        minHeight: 500,
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
        paddingBottom: 40,
    },
    inputGroup: {
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
        fontWeight: '500',
    },
    dropdownList: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        marginTop: 4,
        marginBottom: 16,
        paddingVertical: 4,
        elevation: 5,
        zIndex: 100,
        maxHeight: 200,
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
        color: colors.textPrimary,
    },
    descriptionText: {
        fontSize: 11,
        color: colors.textTertiary,
        marginTop: 2,
    },
    // Section Styles
    sectionContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.background,
    },
    sectionContent: {
        padding: 8,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: colors.textTertiary,
    },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    permissionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    permLabel: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    permDesc: {
        fontSize: 11,
        color: colors.textTertiary,
        marginTop: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subSection: {
        borderTopWidth: 1,
        marginTop: 8,
        paddingTop: 8,
    },
    subSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    subSectionStatus: {
        fontSize: 12,
        color: colors.textTertiary,
        marginRight: 4,
    },
    subSectionContent: {
        marginTop: 4,
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
    passwordInput: {
        flex: 1,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
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
    roleSelector: {
        // unused in new design but kept for types
    },
    roleButton: {
        // unused
    },
    roleButtonActive: {
        // unused
    },
    roleButtonText: {
        // unused
    },
    roleButtonTextActive: {
        // unused
    },
});

export default EmployeeFormModal;
