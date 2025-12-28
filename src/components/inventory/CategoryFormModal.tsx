import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Pressable,
    Switch
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../services/categoriesService';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface CategoryFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: Category | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
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
    const [icon, setIcon] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.name);
                setIcon(initialData.icon || '');
                setIsActive(initialData.isActive);
                setSortOrder(initialData.sortOrder?.toString() || '0');
            } else {
                setName('');
                setIcon('');
                setIsActive(true);
                setSortOrder('0');
            }
            setLoading(false);
        }
    }, [visible, initialData]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Category Name is required');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                name: name.trim(),
                icon: icon.trim() || undefined,
                sortOrder: parseInt(sortOrder) || 0,
            };

            if (initialData) {
                payload.isActive = isActive;
            }

            await onSubmit(payload);
            onClose();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!initialData?.id || !onDelete) return;

        Alert.alert(
            'Delete Category',
            'Are you sure? Items in this category might be affected.',
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
                            Alert.alert('Error', 'Failed to delete category');
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
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{initialData ? 'Edit Category' : 'New Category'}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.scrollView} 
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Beverages"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                            </View>

                            {/* Icon (Optional) */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Icon Name (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={icon}
                                    onChangeText={setIcon}
                                    placeholder="e.g. coffee (Material Design Icon)"
                                    placeholderTextColor={COLORS.textTertiary}
                                    autoCapitalize="none"
                                />
                                {icon ? (
                                    <View style={styles.iconPreview}>
                                        <Text style={styles.helperText}>Preview: </Text>
                                        <Icon name={icon} size={24} color={COLORS.primary} />
                                    </View>
                                ) : null}
                            </View>

                            {/* Sort Order */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Sort Order</Text>
                                <TextInput
                                    style={styles.input}
                                    value={sortOrder}
                                    onChangeText={setSortOrder}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                                <Text style={styles.helperText}>Lower numbers appear first in the menu.</Text>
                            </View>

                            {/* Active Switch */}
                            {initialData && (
                                <View style={styles.switchRow}>
                                    <View>
                                        <Text style={styles.switchLabel}>Active Status</Text>
                                        <Text style={styles.switchSubLabel}>Show in POS menu</Text>
                                    </View>
                                    <Switch
                                        value={isActive}
                                        onValueChange={setIsActive}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                        thumbColor="#FFF"
                                    />
                                </View>
                            )}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardAvoidingView: {
        width: '90%',
        maxWidth: 400,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxHeight: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        // Allow scroll
    },
    scrollContent: {
        paddingBottom: 20,
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
    helperText: {
        fontSize: 12,
        color: colors.textTertiary,
        marginTop: 4,
    },
    iconPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: colors.containerGray,
        padding: 12,
        borderRadius: 12,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    switchSubLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 16,
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
});

export default CategoryFormModal;
