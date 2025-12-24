import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Pressable
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item, CreateItemDto, UpdateItemDto } from '../../services/itemsService';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface Category {
    id: string;
    name: string;
}

interface ItemFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateItemDto | UpdateItemDto) => Promise<void>;
    onDelete?: (itemId: string) => Promise<void>;
    initialData?: Item | null;
    categories: Category[];
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
    visible,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    categories
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [costPrice, setCostPrice] = useState(''); // Added state
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'item' | 'addon'>('item');
    const [trackStock, setTrackStock] = useState(false);
    const [stock, setStock] = useState('');
    const [lowStock, setLowStock] = useState('');

    const [loading, setLoading] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.name);
                setPrice(initialData.price.toString());
                setCostPrice(initialData.costPrice?.toString() || ''); // Init cost price
                setCategoryId(initialData.categoryId);
                setDescription(initialData.description || '');
                setType(initialData.type?.toLowerCase() === 'addon' ? 'addon' : 'item');
                setTrackStock(initialData.trackStock || false);
                setStock(initialData.availableStock?.toString() || '0');
                setLowStock(initialData.lowStockThresholdYellow?.toString() || '5');
            } else {
                // Reset form for create
                setName('');
                setPrice('');
                setCostPrice('');
                setCategoryId(categories.length > 0 ? categories[0].id : '');
                setDescription('');
                setType('item');
                setTrackStock(true);
                setStock('0');
                setLowStock('5');
            }
            setLoading(false);
        }
    }, [visible, initialData, categories]);

    const handleSubmit = async () => {
        if (!name || !price || !categoryId) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Price, Category)');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                name,
                price: parseFloat(price),
                costPrice: costPrice ? parseFloat(costPrice) : undefined, // Add to payload
                categoryId,
                description,
                type: type as 'item' | 'addon', // Fix type mismatch
                trackStock,
            };

            if (trackStock) {
                payload.availableStock = parseInt(stock) || 0;
                // The backend might expect this in a different way or update stock separately?
                // Based on DTO, create/update accepts availableStock.
            }

            await onSubmit(payload);
            onClose();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save item');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!initialData?.id || !onDelete) return;

        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item? This action cannot be undone.',
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
                            Alert.alert('Error', 'Failed to delete item');
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
                            <Text style={styles.title}>{initialData ? 'Edit Item' : 'New Item'}</Text>
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
                            {/* Type Selection */}
                            <View style={styles.typeContainer}>
                                <TouchableOpacity
                                    style={[styles.typeButton, type === 'item' && styles.typeButtonActive]}
                                    onPress={() => setType('item')}
                                >
                                    <Icon name="package-variant" size={20} color={type === 'item' ? '#FFF' : COLORS.textSecondary} />
                                    <Text style={[styles.typeText, type === 'item' && styles.typeTextActive]}>Item</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeButton, type === 'addon' && styles.typeButtonActive]}
                                    onPress={() => setType('addon')}
                                >
                                    <Icon name="puzzle" size={20} color={type === 'addon' ? '#FFF' : COLORS.textSecondary} />
                                    <Text style={[styles.typeText, type === 'addon' && styles.typeTextActive]}>Add-on</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Latte"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                            </View>

                            {/* Price & Cost Price Row */}
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Selling Price</Text>
                                    <View style={styles.priceInputContainer}>
                                        <Text style={styles.currencyPrefix}>JOD</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            value={price}
                                            onChangeText={setPrice}
                                            keyboardType="decimal-pad"
                                            placeholder="0.00"
                                            placeholderTextColor={COLORS.textTertiary}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                    <Text style={styles.label}>Cost Price</Text>
                                    <View style={styles.priceInputContainer}>
                                        <Text style={styles.currencyPrefix}>JOD</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            value={costPrice}
                                            onChangeText={setCostPrice}
                                            keyboardType="decimal-pad"
                                            placeholder="0.00"
                                            placeholderTextColor={COLORS.textTertiary}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Category Row */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Category</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                >
                                    <Text style={styles.dropdownButtonText} numberOfLines={1}>
                                        {categories.find(c => c.id === categoryId)?.name || 'Select Category'}
                                    </Text>
                                    <Icon name="chevron-down" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Category Dropdown Content */}
                            {showCategoryDropdown && (
                                <View style={styles.dropdownList}>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setCategoryId(cat.id);
                                                setShowCategoryDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                categoryId === cat.id && { color: COLORS.primary, fontWeight: '700' }
                                            ]}>
                                                {cat.name}
                                            </Text>
                                            {categoryId === cat.id && <Icon name="check" size={16} color={COLORS.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Description */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Item details..."
                                    placeholderTextColor={COLORS.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            {/* Stock Toggle */}
                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchLabel}>Track Stock</Text>
                                    <Text style={styles.switchSubLabel}>Manage inventory count</Text>
                                </View>
                                <Switch
                                    value={trackStock}
                                    onValueChange={setTrackStock}
                                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                    thumbColor="#FFF"
                                />
                            </View>

                            {/* Stock Inputs */}
                            {trackStock && (
                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                        <Text style={styles.label}>In Stock</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={stock}
                                            onChangeText={setStock}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textTertiary}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                        <Text style={styles.label}>Low Stock</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={lowStock}
                                            onChangeText={setLowStock}
                                            keyboardType="number-pad"
                                            placeholder="5"
                                            placeholderTextColor={COLORS.textTertiary}
                                        />
                                    </View>
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
        maxWidth: 500,
        maxHeight: '85%',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxHeight: '100%',
        flexShrink: 1, // Allow it to shrink if needed but also expand to content
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
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
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: colors.containerGray,
        padding: 4,
        borderRadius: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    typeButtonActive: {
        backgroundColor: colors.primary,
    },
    typeText: {
        fontWeight: '600',
        color: colors.textSecondary,
        fontSize: 14,
    },
    typeTextActive: {
        color: '#FFF',
        fontWeight: '700',
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        overflow: 'hidden',
    },
    currencyPrefix: {
        paddingLeft: 12,
        paddingRight: 6,
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 12,
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: '700',
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

export default ItemFormModal;
