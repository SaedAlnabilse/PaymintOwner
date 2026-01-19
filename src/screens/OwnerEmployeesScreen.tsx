import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Modal,
    Pressable,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { apiClient } from '../services/apiClient';
import OwnerEmployeeFormModal from '../components/staff/OwnerEmployeeFormModal';

interface EmployeeAssignment {
    establishmentId: string;
    establishmentName: string;
    role: string;
    permissions: string[];
    assignmentsId: string;
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string | null;
    role: string;
    accessLevel: string;
    establishments: string[];
    assignments: EmployeeAssignment[];
}

const getRoleColor = (role: string, colors: any) => {
    switch (role?.toUpperCase()) {
        case 'ADMIN':
            return colors.primary;
        case 'MANAGER':
            return colors.graphGray;
        case 'USER':
            return colors.info;
        default:
            return colors.textSecondary;
    }
};

const getRoleBadgeStyle = (role: string, colors: any) => {
    switch (role?.toUpperCase()) {
        case 'ADMIN':
            return { bg: colors.successBg, text: colors.primary };
        case 'MANAGER':
            return { bg: colors.warningBg, text: colors.warning };
        case 'USER':
            return { bg: colors.infoBg, text: colors.info };
        default:
            return { bg: colors.containerGray, text: colors.textSecondary };
    }
};

interface EmployeeCardProps {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
    styles: any;
    colors: any;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
    employee,
    onEdit,
    onDelete,
    styles,
    colors
}) => {
    const roleStyle = getRoleBadgeStyle(employee.role, colors);
    const initial = employee.firstName?.charAt(0)?.toUpperCase() || 'U';

    return (
        <TouchableOpacity
            style={[styles.employeeCard, { backgroundColor: colors.white }]}
            onPress={() => onEdit(employee)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.employeeInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.containerGray }]}>
                        <Text style={[styles.avatarText, { color: getRoleColor(employee.role, colors) }]}>
                            {initial}
                        </Text>
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.employeeName, { color: colors.textPrimary }]}>
                            {employee.firstName} {employee.lastName}
                        </Text>
                        <Text style={[styles.username, { color: colors.textSecondary }]}>
                            @{employee.username}
                        </Text>
                    </View>
                </View>

                <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.roleText, { color: roleStyle.text }]}>
                        {employee.role?.toUpperCase() === 'USER' ? 'STAFF' : employee.role?.toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* Locations Section */}
            <View style={[styles.locationsSection, { borderTopColor: colors.borderLight }]}>
                <View style={styles.locationHeader}>
                    <Icon name="map-marker-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>
                        Access Locations
                    </Text>
                </View>
                <View style={styles.locationTags}>
                    {employee.assignments?.length > 0 ? (
                        <>
                            {employee.assignments.slice(0, 2).map((assignment, idx) => (
                                <View
                                    key={idx}
                                    style={[styles.locationTag, { backgroundColor: colors.containerGray }]}
                                >
                                    <Text style={[styles.locationTagText, { color: colors.textPrimary }]}>
                                        {assignment.establishmentName}
                                    </Text>
                                </View>
                            ))}
                            {employee.assignments.length > 2 && (
                                <View style={[styles.locationTag, { backgroundColor: colors.containerGray }]}>
                                    <Text style={[styles.locationTagText, { color: colors.textSecondary }]}>
                                        +{employee.assignments.length - 2} more
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <Text style={[styles.noLocations, { color: colors.textTertiary }]}>
                            No locations assigned
                        </Text>
                    )}
                </View>
            </View>

            {/* Actions */}
            <View style={[styles.cardActions, { borderTopColor: colors.borderLight }]}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.containerGray }]}
                    onPress={() => onEdit(employee)}
                >
                    <Icon name="pencil-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.errorBg }]}
                    onPress={() => onDelete(employee)}
                >
                    <Icon name="trash-can-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const OwnerEmployeesScreen = () => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    const { establishments, account } = useSelector((state: RootState) => state.auth);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Form Modal State
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/accounts/all-employees');
            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            Alert.alert('Error', 'Failed to load employees');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEmployees();
    };

    const handleAddEmployee = () => {
        setEditingEmployee(null);
        setShowFormModal(true);
    };

    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee);
        setShowFormModal(true);
    };

    const handleDeletePress = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setDeletePassword('');
        setDeleteError('');
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete || !account?.email) return;

        if (!deletePassword.trim()) {
            setDeleteError('Please enter your password');
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            await apiClient.delete(`/api/accounts/employees/${employeeToDelete.id}`, {
                data: { email: account.email, password: deletePassword }
            });
            setShowDeleteModal(false);
            setEmployeeToDelete(null);
            fetchEmployees();
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || 'Incorrect password or failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEmployeeSubmit = async (data: any) => {
        try {
            if (editingEmployee) {
                await apiClient.put(`/api/accounts/employees/${editingEmployee.id}`, data);
            } else {
                await apiClient.post('/api/accounts/employees', data);
            }
            setShowFormModal(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            throw error;
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch =
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                emp.username.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [employees, searchQuery, roleFilter]);

    const stats = useMemo(() => ({
        total: employees.length,
        admins: employees.filter(e => e.role === 'ADMIN').length,
        staff: employees.filter(e => e.role !== 'ADMIN').length,
    }), [employees]);

    const roleOptions = [
        { label: 'All Roles', value: 'all' },
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Staff', value: 'USER' },
    ];

    return (
        <ScreenContainer style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <View style={[styles.headerBadge, { backgroundColor: COLORS.successBg }]}>
                            <Text style={[styles.headerBadgeText, { color: COLORS.primary }]}>
                                UNIFIED ACCESS CONTROL
                            </Text>
                        </View>
                        <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>
                            Global Workforce
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
                            Manage personnel across {establishments.length} locations
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.refreshButton, { backgroundColor: COLORS.containerGray }]}
                            onPress={onRefresh}
                        >
                            <Icon
                                name="refresh"
                                size={20}
                                color={COLORS.textSecondary}
                                style={refreshing ? styles.spinning : undefined}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
                            onPress={handleAddEmployee}
                        >
                            <Icon name="plus" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                        <Icon name="account-group" size={20} color="#FFF" />
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                        <Icon name="shield-account" size={20} color="#FFF" />
                        <Text style={styles.statValue}>{stats.admins}</Text>
                        <Text style={styles.statLabel}>Admins</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                        <Icon name="account-multiple" size={20} color="#FFF" />
                        <Text style={styles.statValue}>{stats.staff}</Text>
                        <Text style={styles.statLabel}>Staff</Text>
                    </View>
                </View>

                {/* Search & Filter */}
                <View style={styles.searchRow}>
                    <View style={[styles.searchContainer, { backgroundColor: COLORS.surface }]}>
                        <Icon name="magnify" size={20} color={COLORS.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: COLORS.textPrimary }]}
                            placeholder="Search by name or email..."
                            placeholderTextColor={COLORS.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Icon name="close-circle" size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: COLORS.surface }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Icon name="filter-variant" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
                        Loading workforce...
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                >
                    {filteredEmployees.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: COLORS.white }]}>
                            <Icon name="account-group-outline" size={48} color={COLORS.textTertiary} />
                            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
                                No personnel found
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                                Adjust filters or add new team members
                            </Text>
                        </View>
                    ) : (
                        filteredEmployees.map(employee => (
                            <EmployeeCard
                                key={employee.id}
                                employee={employee}
                                onEdit={handleEditEmployee}
                                onDelete={handleDeletePress}
                                styles={styles}
                                colors={COLORS}
                            />
                        ))
                    )}

                    {/* Bottom CTA */}
                    <TouchableOpacity
                        style={[styles.bottomCTA, { backgroundColor: COLORS.textPrimary }]}
                        onPress={handleAddEmployee}
                    >
                        <View>
                            <Text style={styles.ctaTitle}>Scale Your Workforce</Text>
                            <Text style={styles.ctaSubtitle}>
                                Add employees with unified access control
                            </Text>
                        </View>
                        <View style={[styles.ctaButton, { backgroundColor: COLORS.primary }]}>
                            <Icon name="plus" size={20} color="#000" />
                            <Text style={styles.ctaButtonText}>Add</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)} />
                    <View style={[styles.filterModalContent, { backgroundColor: COLORS.surface }]}>
                        <View style={styles.filterModalHeader}>
                            <Text style={[styles.filterModalTitle, { color: COLORS.textPrimary }]}>Filter by Role</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {roleOptions.map(option => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.filterOption,
                                    roleFilter === option.value && { backgroundColor: COLORS.successBg }
                                ]}
                                onPress={() => {
                                    setRoleFilter(option.value);
                                    setShowFilterModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    { color: roleFilter === option.value ? COLORS.primary : COLORS.textPrimary }
                                ]}>
                                    {option.label}
                                </Text>
                                {roleFilter === option.value && (
                                    <Icon name="check" size={18} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)} />
                    <View style={[styles.deleteModalContent, { backgroundColor: COLORS.surface }]}>
                        <View style={[styles.deleteIconContainer, { backgroundColor: COLORS.errorBg }]}>
                            <Icon name="alert" size={32} color={COLORS.error} />
                        </View>
                        <Text style={[styles.deleteTitle, { color: COLORS.textPrimary }]}>
                            Terminate Access
                        </Text>
                        <Text style={[styles.deleteMessage, { color: COLORS.textSecondary }]}>
                            Are you sure you want to remove{' '}
                            <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>
                                {employeeToDelete?.firstName} {employeeToDelete?.lastName}
                            </Text>
                            {' '}from the workforce? This action is irreversible.
                        </Text>

                        <View style={styles.passwordSection}>
                            <Text style={[styles.passwordLabel, { color: COLORS.textSecondary }]}>
                                Verify Password
                            </Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={[
                                        styles.passwordInput,
                                        { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderColor: deleteError ? COLORS.error : COLORS.border }
                                    ]}
                                    value={deletePassword}
                                    onChangeText={(text) => { setDeletePassword(text); setDeleteError(''); }}
                                    placeholder="Enter your account password"
                                    placeholderTextColor={COLORS.textTertiary}
                                    secureTextEntry={!showDeletePassword}
                                />
                                <TouchableOpacity
                                    style={[styles.passwordToggle, { backgroundColor: COLORS.background, borderColor: deleteError ? COLORS.error : COLORS.border }]}
                                    onPress={() => setShowDeletePassword(!showDeletePassword)}
                                >
                                    <Icon name={showDeletePassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {deleteError ? (
                                <Text style={[styles.deleteErrorText, { color: COLORS.error }]}>{deleteError}</Text>
                            ) : null}
                        </View>

                        <View style={styles.deleteActions}>
                            <TouchableOpacity
                                style={[styles.cancelDeleteButton, { borderColor: COLORS.border }]}
                                onPress={() => setShowDeleteModal(false)}
                            >
                                <Text style={[styles.cancelDeleteText, { color: COLORS.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmDeleteButton, { backgroundColor: COLORS.error }]}
                                onPress={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Icon name="trash-can-outline" size={16} color="#FFF" />
                                        <Text style={styles.confirmDeleteText}>Confirm</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Employee Form Modal */}
            <OwnerEmployeeFormModal
                visible={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSubmit={handleEmployeeSubmit}
                establishments={establishments}
                initialData={editingEmployee ? {
                    id: editingEmployee.id,
                    name: `${editingEmployee.firstName} ${editingEmployee.lastName}`,
                    username: editingEmployee.username,
                    role: editingEmployee.role,
                    email: editingEmployee.email ?? undefined,
                    permissions: editingEmployee.assignments?.[0]?.permissions || [],
                    establishmentIds: editingEmployee.assignments?.map(a => a.establishmentId) || []
                } : null}
            />
        </ScreenContainer>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    header: {
        padding: 20,
        paddingBottom: 16,
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    headerBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinning: {
        // RN doesn't support CSS animations, this is a placeholder
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    statValue: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '800',
        marginTop: 4,
    },
    statLabel: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.9,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyState: {
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 13,
        marginTop: 4,
    },
    employeeCard: {
        borderRadius: 18,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.borderLight,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    employeeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
    },
    nameContainer: {
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    username: {
        fontSize: 12,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    locationsSection: {
        padding: 14,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    locationTag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    locationTagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    noLocations: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    cardActions: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
    bottomCTA: {
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ctaTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    ctaSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    ctaButtonText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '700',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    filterModalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 20,
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterModalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 6,
    },
    filterOptionText: {
        fontSize: 15,
        fontWeight: '600',
    },
    deleteModalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    deleteIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    deleteMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    passwordSection: {
        width: '100%',
        marginBottom: 20,
    },
    passwordLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    passwordInputContainer: {
        flexDirection: 'row',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    passwordToggle: {
        width: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    deleteErrorText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },
    deleteActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelDeleteButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelDeleteText: {
        fontSize: 14,
        fontWeight: '700',
    },
    confirmDeleteButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmDeleteText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default OwnerEmployeesScreen;
