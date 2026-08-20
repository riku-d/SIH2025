import Pharmacy from '../models/Pharmacy.js';
import MedicineStock from '../models/MedicineStock.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';

// Pharmacy Management
/**
 * What the cart needs to know about a medicine.
 *
 * Defined once because it was written out at four call sites and only one of
 * them was ever updated: prescriptionRequired was missing, so the checkout
 * could not tell that the cart held a prescription-only medicine. The upload
 * box never appeared, and the server then refused the order — leaving the
 * patient no way to comply with a rule the app itself enforced.
 */
const CART_MEDICINE_FIELDS = 'medicineName brand price finalPrice quantity stockStatus image prescriptionRequired';

export const createPharmacy = async (req, res) => {
    try {
        console.log('Creating pharmacy for user:', req.user);
        console.log('Request body:', req.body);
        
        // Validate required fields
        const { name, location, address, contact } = req.body;
        if (!name || !location || !address || !contact) {
            return res.status(400).json({ 
                message: 'Missing required fields: name, location, address, and contact are required' 
            });
        }
        
        // Check if pharmacy already exists for this user
        const existingPharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
        if (existingPharmacy) {
            return res.status(400).json({ message: 'You already have a pharmacy registered' });
        }
        
        const pharmacyData = { ...req.body, ownerId: req.user.id };
        console.log('Creating pharmacy with data:', pharmacyData);
        
        const pharmacy = new Pharmacy(pharmacyData);
        const savedPharmacy = await pharmacy.save();
        
        console.log('Pharmacy created successfully:', savedPharmacy);
        res.status(201).json(savedPharmacy);
    } catch (e) {
        console.error('Error creating pharmacy:', e);
        console.error('Error details:', {
            message: e.message,
            stack: e.stack,
            name: e.name
        });
        
        if (e.name === 'ValidationError') {
            const errors = Object.values(e.errors).map(err => err.message);
            return res.status(400).json({ message: `Validation error: ${errors.join(', ')}` });
        }
        
        res.status(500).json({ message: e.message || 'Internal server error' });
    }
};

export const getPharmacy = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id }).populate('ownerId', 'name email');
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json(pharmacy);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updatePharmacy = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOneAndUpdate(
            { ownerId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json(pharmacy);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getAllPharmacies = async (req, res) => {
    try {
        const { location, search } = req.query;
        let query = { isActive: true };
        
        if (location) {
            query.location = new RegExp(location, 'i');
        }
        
        if (search) {
            query.name = new RegExp(search, 'i');
        }
        
        const pharmacies = await Pharmacy.find(query)
            .select('name location address contact description image openingHours deliveryAvailable ratings')
            .sort({ 'ratings.average': -1 });
        res.json(pharmacies);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getPharmacyById = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findById(req.params.id)
            .populate('ownerId', 'name email phone');
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json(pharmacy);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Medicine Stock Management
export const addMedicine = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        
        const medicineData = { ...req.body, pharmacyId: pharmacy._id };
        const medicine = new MedicineStock(medicineData);
        await medicine.save();
        
        // Emit real-time update
        req.io.emit('medicine-added', { pharmacyId: pharmacy._id, medicine });
        
        res.status(201).json(medicine);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateStock = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        
        const { medicineId } = req.params;
        const stock = await MedicineStock.findOneAndUpdate(
            { _id: medicineId, pharmacyId: pharmacy._id },
            { $set: { ...req.body, lastUpdated: new Date() } },
            { new: true }
        );
        
        if (!stock) return res.status(404).json({ message: 'Medicine not found' });
        
        // Emit real-time update
        req.io.emit('stock-updated', { pharmacyId: pharmacy._id, medicine: stock });
        
        res.json(stock);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const deleteMedicine = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        
        const { medicineId } = req.params;
        const medicine = await MedicineStock.findOneAndDelete({
            _id: medicineId,
            pharmacyId: pharmacy._id
        });
        
        if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
        
        // Emit real-time update
        req.io.emit('medicine-removed', { pharmacyId: pharmacy._id, medicineId });
        
        res.json({ message: 'Medicine deleted successfully' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getPharmacyMedicines = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        
        const { search, category, page = 1, limit = 20 } = req.query;
        let query = { pharmacyId: pharmacy._id, isActive: true };
        
        // Only add text search if search term is provided and text index exists
        if (search) {
            // Use regex search instead of text search to avoid index issues
            query.$or = [
                { medicineName: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        console.log('Fetching medicines with query:', query);
        
        const medicines = await MedicineStock.find(query)
            .sort({ medicineName: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await MedicineStock.countDocuments(query);
        
        console.log(`Found ${medicines.length} medicines out of ${total} total`);
        
        res.json({
            medicines,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (e) {
        console.error('Error fetching pharmacy medicines:', e);
        res.status(500).json({ message: e.message });
    }
};

// Public medicine browsing
export const getPharmacyMedicinesPublic = async (req, res) => {
    try {
        const { pharmacyId } = req.params;
        const { search, category, page = 1, limit = 20 } = req.query;
        
        let query = { pharmacyId, isActive: true };
        
        if (search) {
            // Use regex search instead of text search to avoid index issues
            query.$or = [
                { medicineName: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        const medicines = await MedicineStock.find(query)
            .populate('pharmacyId', 'name location contact')
            .sort({ medicineName: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await MedicineStock.countDocuments(query);
        
        res.json({
            medicines,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const checkStock = async (req, res) => {
    try {
        const { medicineName } = req.params;
        const stocks = await MedicineStock.find({ 
            medicineName: new RegExp(`^${medicineName}$`, 'i'),
            isActive: true
        }).populate('pharmacyId', 'name location contact address');
        res.json(stocks);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Cart Management
export const getCart = async (req, res) => {
    try {
        const { pharmacyId } = req.params;
        let cart = await Cart.findOne({ userId: req.user.id, pharmacyId })
            .populate({
                path: 'items.medicineId',
                model: 'MedicineStock',
                select: CART_MEDICINE_FIELDS
            })
            .populate('pharmacyId', 'name location contact');
            
        if (!cart) {
            cart = new Cart({ userId: req.user.id, pharmacyId, items: [] });
            await cart.save();
        }
        
        res.json(cart);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { pharmacyId, medicineId, quantity } = req.body;
        
        // Verify medicine exists and has stock
        const medicine = await MedicineStock.findById(medicineId);
        if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
        if (medicine.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }
        
        let cart = await Cart.findOne({ userId: req.user.id, pharmacyId });
        
        if (!cart) {
            cart = new Cart({ userId: req.user.id, pharmacyId, items: [] });
        }
        
        const existingItemIndex = cart.items.findIndex(item => 
            item.medicineId.toString() === medicineId
        );
        
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                medicineId,
                quantity,
                price: medicine.price,
                finalPrice: medicine.finalPrice
            });
        }
        
        await cart.save();
        await cart.populate({
            path: 'items.medicineId',
            model: 'MedicineStock',
            select: CART_MEDICINE_FIELDS
        });
        
        res.json(cart);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { pharmacyId, medicineId } = req.params;
        const { quantity } = req.body;
        
        if (quantity <= 0) {
            return removeFromCart(req, res);
        }
        
        // Verify stock
        const medicine = await MedicineStock.findById(medicineId);
        if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
        if (medicine.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }
        
        const cart = await Cart.findOne({ userId: req.user.id, pharmacyId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });
        
        const itemIndex = cart.items.findIndex(item => 
            item.medicineId.toString() === medicineId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }
        
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        
        await cart.populate({
            path: 'items.medicineId',
            model: 'MedicineStock',
            select: CART_MEDICINE_FIELDS
        });
        
        res.json(cart);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { pharmacyId, medicineId } = req.params;
        
        const cart = await Cart.findOne({ userId: req.user.id, pharmacyId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });
        
        cart.items = cart.items.filter(item => 
            item.medicineId.toString() !== medicineId
        );
        
        await cart.save();
        
        await cart.populate({
            path: 'items.medicineId',
            model: 'MedicineStock',
            select: CART_MEDICINE_FIELDS
        });
        
        res.json(cart);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        const { pharmacyId } = req.params;
        
        const cart = await Cart.findOne({ userId: req.user.id, pharmacyId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });
        
        cart.items = [];
        await cart.save();
        
        res.json(cart);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Order Management
export const createOrder = async (req, res) => {
    try {
        const { pharmacyId, orderType, deliveryAddress, notes, prescriptionImage } = req.body;
        
        // Get cart
        const cart = await Cart.findOne({ userId: req.user.id, pharmacyId })
            .populate('items.medicineId');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        
        // Verify stock and prepare order items
        const orderItems = [];
        let totalAmount = 0;
        let prescriptionRequired = false;
        
        for (const cartItem of cart.items) {
            const medicine = cartItem.medicineId;
            
            if (medicine.quantity < cartItem.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${medicine.medicineName}` 
                });
            }
            
            const itemTotal = cartItem.finalPrice * cartItem.quantity;
            orderItems.push({
                medicineId: medicine._id,
                medicineName: medicine.medicineName,
                quantity: cartItem.quantity,
                price: cartItem.price,
                finalPrice: cartItem.finalPrice,
                total: itemTotal
            });
            
            totalAmount += itemTotal;
            if (medicine.prescriptionRequired) {
                prescriptionRequired = true;
            }
        }
        
        // Calculate delivery fee if applicable
        let deliveryFee = 0;
        if (orderType === 'delivery') {
            deliveryFee = totalAmount < 500 ? 50 : 0; // Free delivery above 500
            totalAmount += deliveryFee;
        }
        
        /**
         * Prescription-only medicines need a prescription.
         *
         * The order carried a prescriptionRequired flag and an empty
         * prescriptionImage field that nothing ever filled, so antibiotics
         * and other Schedule H drugs could be ordered with one tap and no
         * prescription at all. The flag told the pharmacy to worry; it did
         * not stop the order.
         */
        if (prescriptionRequired && !prescriptionImage) {
            return res.status(400).json({
                message: 'A photo of your prescription is needed for one or more of these medicines.',
                code: 'prescription_required'
            });
        }

        /**
         * Reserve stock before the order exists, one medicine at a time and
         * conditionally, so two people checking out the last strip cannot
         * both pass the earlier check and drive the count negative.
         */
        const reserved = [];
        for (const cartItem of cart.items) {
            const taken = await MedicineStock.findOneAndUpdate(
                { _id: cartItem.medicineId._id, quantity: { $gte: cartItem.quantity } },
                { $inc: { quantity: -cartItem.quantity }, lastUpdated: new Date() },
                { new: true }
            );

            if (!taken) {
                // Someone got there first. Put back whatever we already took,
                // so a failed checkout never quietly consumes stock.
                for (const done of reserved) {
                    await MedicineStock.findByIdAndUpdate(done.id, { $inc: { quantity: done.quantity } });
                }
                return res.status(409).json({
                    message: `${cartItem.medicineId.medicineName} was just sold out. Please review your cart.`,
                    code: 'out_of_stock'
                });
            }
            reserved.push({ id: cartItem.medicineId._id, quantity: cartItem.quantity, remaining: taken.quantity });
        }

        // Create order
        const order = new Order({
            userId: req.user.id,
            pharmacyId,
            items: orderItems,
            orderType,
            deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
            totalAmount,
            deliveryFee,
            prescriptionRequired,
            prescriptionImage: prescriptionImage || '',
            notes
        });

        try {
            await order.save();
        } catch (err) {
            // The order failed after stock was taken — release it again.
            for (const done of reserved) {
                await MedicineStock.findByIdAndUpdate(done.id, { $inc: { quantity: done.quantity } });
            }
            throw err;
        }

        for (const cartItem of cart.items) {
            
            // Emit real-time stock update
            req.io.emit('stock-updated', { 
                pharmacyId, 
                medicineId: cartItem.medicineId._id,
                newQuantity: reserved.find(r => String(r.id) === String(cartItem.medicineId._id))?.remaining
            });
        }
        
        // Clear cart
        cart.items = [];
        await cart.save();
        
        // Populate order for response
        await order.populate([
            { path: 'userId', select: 'name email phone' },
            { path: 'pharmacyId', select: 'name location contact' }
        ]);
        
        // Emit new order to pharmacy
        req.io.to(`pharmacy_${pharmacyId}`).emit('new-order', order);
        
        res.status(201).json(order);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = { userId: req.user.id };
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const orders = await Order.find(query)
            .populate('pharmacyId', 'name location contact')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Order.countDocuments(query);
        
        res.json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getPharmacyOrders = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = { pharmacyId: pharmacy._id };
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const orders = await Order.find(query)
            .populate('userId', 'name email phone')
            // The prescription photo is a base64 image. Ten of them in one
            // page of orders is megabytes over a connection that can barely
            // carry the list itself, and most orders do not have one — so it
            // is fetched per order, only when the pharmacist opens it.
            .select('-prescriptionImage')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Order.countDocuments(query);
        
        res.json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ ownerId: req.user.id });
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        
        const { orderId } = req.params;
        const { status, note } = req.body;
        
        const order = await Order.findOne({ 
            _id: orderId, 
            pharmacyId: pharmacy._id 
        });
        
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        order.updateStatus(status, note);
        await order.save();
        
        // Emit order status update
        req.io.to(`user_${order.userId}`).emit('order-status-updated', {
            orderId: order._id,
            status,
            note
        });
        
        res.json(order);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findById(orderId)
            .populate('userId', 'name email phone')
            // ownerId was missing from this projection, so the access check
            // below dereferenced undefined and threw — meaning a pharmacy
            // could never open one of its own orders, only ever a 500.
            .populate('pharmacyId', 'name location contact address ownerId');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isPatient = String(order.userId?._id) === String(req.user.id);
        const isPharmacy = String(order.pharmacyId?.ownerId) === String(req.user.id);

        if (!isPatient && !isPharmacy) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(order);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};


