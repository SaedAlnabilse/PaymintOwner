import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { CreateUserDto, UpdateUserDto } from '../../services/users';

interface StaffMember {
    id: string;
    name: string;
    username: string;
    role: string;
    email?: string;
}

interface EmployeeFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: StaffMember | null;
}

const ROLES = [
    { label: 'Manager', value: 'MANAGER' },
    { label: 'Cashier', value: 'CASHIER' },
    { label: 'Barista', value: 'BARISTA' },
    { label: 'Server', value: 'SERVER' },
    { label: 'Kitchen', value: 'KITCHEN' },
];

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
    visible,
    onClose,
    onSubmit,
    onDelete,
    initialData
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('CASHIER');
    const [pinCode, setPinCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.name);
                setUsername(initialData.username);
                setEmail(initialData.email || '');
                // Match role case-insensitive
                const foundRole = ROLES.find(r => r.value.toUpperCase() === initialData.role.toUpperCase())?.value;
                setRole(foundRole || 'CASHIER');
                setPinCode(''); // Don't show existing PIN
            } else {
                setName('');
                setUsername('');
                setEmail('');
                setRole('CASHIER');
                setPinCode('');
            }
            setLoading(false);
        }
    }, [visible, initialData]);

    const handleSubmit = async () => {
        if (!name || !username || !role) {
            Alert.alert('Error', 'Please fill in Name, Username and Role');
            return;
        }

        if (!initialData && !pinCode) {
            Alert.alert('Error', 'PIN Code is required for new employees');
            return;
        }

        if (pinCode && pinCode.length < 4) {
            Alert.alert('Error', 'PIN Code must be at least 4 digits');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                name,
                username,
                email,
                role: role.toUpperCase(),
            };

            if (pinCode) {
                payload.pinCode = pinCode;
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
                        } catch (error) {
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
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{initialData ? 'Edit Employee' : 'New Employee'}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>

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

                            {/* Role Dropdown */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Role</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                                >
                                    <Text style={styles.dropdownButtonText}>
                                        {ROLES.find(r => r.value === role)?.label || role}
                                    </Text>
                                    <Icon name="chevron-down" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Role Dropdown Content */}
                            {showRoleDropdown && (
                                <View style={styles.dropdownList}>
                                    {ROLES.map(r => (
                                        <TouchableOpacity
                                            key={r.value}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setRole(r.value);
                                                setShowRoleDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                role === r.value && { color: COLORS.primary, fontWeight: '700' }
                                            ]}>
                                                {r.label}
                                            </Text>
                                            {role === r.value && <Icon name="check" size={16} color={COLORS.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* PIN Code */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PIN Code {initialData ? '(Leave blank to keep current)' : '(Required)'}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={pinCode}
                                    onChangeText={setPinCode}
                                    placeholder="e.g. 1234"
                                    placeholderTextColor={COLORS.textTertiary}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    secureTextEntry
                                />
                            </View>

                            <View style={{ height: 40 }} />
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
                                style={[styles.submitButton, { flex: initialData ? 1 : undefined, marginLeft: initialData ? 12 : 0 }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Text style={styles.submitButtonText}>Saving...</Text>
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {initialData ? 'Save Changes' : 'Add Employee'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 8,
        backgroundColor: colors.containerGray,
        borderRadius: 50,
    },
    formContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
    },
    dropdownButton: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    dropdownList: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        marginTop: -16,
        marginBottom: 20,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 10,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    dropdownItemText: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    deleteButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.errorBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        flex: 1,
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});

export default EmployeeFormModal;
