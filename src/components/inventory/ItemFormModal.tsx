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
    ActivityIndicator,
    Pressable,
    Image,
    Dimensions
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item, CreateItemDto, UpdateItemDto } from '../../services/itemsService';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { getImageUrl } from '../../config/api.config';
import ATMInput from '../common/ATMInput';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Category {
    id: string;
    name: string;
}

interface ItemFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
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
    const [price, setPrice] = useState(0);
    const [costPrice, setCostPrice] = useState(0); // Added state
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'item' | 'addon'>('item');
    const [trackStock, setTrackStock] = useState(false);
    const [stock, setStock] = useState(0);
    const [lowStock, setLowStock] = useState(5);

    const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setName(initialData.name);
                setPrice(initialData.price);
                setCostPrice(initialData.costPrice || 0); // Init cost price
                setCategoryId(initialData.categoryId);
                setDescription(initialData.description || '');
                setType(initialData.type?.toLowerCase() === 'addon' ? 'addon' : 'item');
                setTrackStock(initialData.trackStock || false);
                setStock(initialData.availableStock || 0);
                setLowStock(initialData.lowStockThresholdYellow || 5);
                setSelectedImage(null);
                setPreviewUrl(initialData.image ? getImageUrl(initialData.image) || null : null);
            } else {
                // Reset form for create
                setName('');
                setPrice(0);
                setCostPrice(0);
                setCategoryId(categories.length > 0 ? categories[0].id : '');
                setDescription('');
                setType('item');
                setTrackStock(true);
                setStock(0);
                setLowStock(5);
                setSelectedImage(null);
                setPreviewUrl(null);
            }
            setLoading(false);
        }
    }, [visible, initialData, categories]);

    const handleChoosePhoto = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
            if (response.assets && response.assets.length > 0) {
                setSelectedImage(response.assets[0]);
                setPreviewUrl(response.assets[0].uri || null);
            }
        });
    };

    const handleSubmit = async () => {
        if (!name || !price || !categoryId) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Price, Category)');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price);
            formData.append('costPrice', costPrice);
            formData.append('categoryId', categoryId);
            formData.append('description', description);
            formData.append('type', type.toUpperCase()); // Backend usually expects uppercase
            formData.append('trackStock', String(trackStock));

            if (trackStock) {
                formData.append('availableStock', stock);
                formData.append('lowStockThresholdYellow', lowStock);
            }

            if (selectedImage) {
                formData.append('image', {
                    uri: selectedImage.uri,
                    type: selectedImage.type || 'image/jpeg',
                    name: selectedImage.fileName || 'item.jpg',
                } as any);
            }

            await onSubmit(formData);
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
                            console.error(error);
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
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    style={styles.keyboardAvoidingView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
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
                            {/* Image Selection */}
                            <View style={styles.imageSection}>
                                <View style={styles.imagePickerContainer}>
                                    {previewUrl ? (
                                        <View style={styles.previewContainer}>
                                            <Image source={{ uri: previewUrl }} style={styles.previewImage} />
                                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setSelectedImage(null); setPreviewUrl(null); }}>
                                                <Icon name="close-circle" size={24} color={COLORS.error} />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={[styles.uploadBtn, { borderColor: COLORS.primary }]} onPress={handleChoosePhoto}>
                                            <Icon name="camera-plus" size={32} color={COLORS.primary} />
                                            <Text style={[styles.uploadText, { color: COLORS.primary }]}>Upload Image</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
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
                                <View style={styles.halfInputLeft}>
                                    <ATMInput
                                        label="Selling Price"
                                        value={price}
                                        onChange={setPrice}
                                        placeholder="0.00"
                                    />
                                </View>

                                <View style={styles.halfInputRight}>
                                    <ATMInput
                                        label="Cost Price"
                                        value={costPrice}
                                        onChange={setCostPrice}
                                        placeholder="0.00"
                                    />
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
                                                categoryId === cat.id && styles.dropdownItemSelected
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
                                    <View style={styles.halfInputLeft}>
                                        <ATMInput
                                            label="In Stock"
                                            value={stock}
                                            onChange={setStock}
                                            currency="Units"
                                            placeholder="0"
                                        />
                                    </View>
                                    <View style={styles.halfInputRight}>
                                        <ATMInput
                                            label="Low Stock"
                                            value={lowStock}
                                            onChange={setLowStock}
                                            currency="Units"
                                            placeholder="5"
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
        flexShrink: 1, // Allow scrolling if content is too large
    },
    scrollContent: {
        paddingBottom: 20,
    },
    imageSection: { marginBottom: 20, alignItems: 'center' },
    imagePickerContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
    uploadBtn: {
        width: 140,
        height: 140,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    uploadText: { fontSize: 12, fontWeight: '700', marginTop: 8 },
    previewContainer: { position: 'relative' },
    previewImage: { width: 140, height: 140, borderRadius: 16 },
    removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: colors.white, borderRadius: 12 },
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
    halfInputLeft: {
        flex: 1,
        marginRight: 10,
        marginBottom: 16,
    },
    halfInputRight: {
        flex: 1,
        marginLeft: 10,
        marginBottom: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        width: '100%',
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
    dropdownItemSelected: {
        color: colors.primary,
        fontWeight: '700',
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
});

export default ItemFormModal;

