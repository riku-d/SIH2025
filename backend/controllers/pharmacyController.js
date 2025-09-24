import Pharmacy from '../models/Pharmacy.js';
import MedicineStock from '../models/MedicineStock.js';

export const updateStock = async (req, res) => {
    try {
        const { pharmacyId, medicineName, quantity } = req.body;
        const pharmacy = await Pharmacy.findById(pharmacyId);
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        const stock = await MedicineStock.findOneAndUpdate(
            { pharmacyId, medicineName },
            { $set: { quantity, lastUpdated: new Date() } },
            { upsert: true, new: true }
        );
        res.json(stock);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const checkStock = async (req, res) => {
    try {
        const { medicineName } = req.params;
        const stocks = await MedicineStock.find({ medicineName: new RegExp(`^${medicineName}$`, 'i') }).populate('pharmacyId', 'name location contact');
        res.json(stocks);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};


