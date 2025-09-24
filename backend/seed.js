import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import Pharmacy from './models/Pharmacy.js';
import MedicineStock from './models/MedicineStock.js';

dotenv.config();

const run = async () => {
    await connectDB();
    await User.deleteMany({});
    await Pharmacy.deleteMany({});
    await MedicineStock.deleteMany({});

    const pw = await bcrypt.hash('password123', 10);

    const patient = await User.create({ name: 'Ravi', email: 'ravi@example.com', passwordHash: pw, role: 'patient', age: 35, village: 'Sundarpur' });
    const doctor = await User.create({ name: 'Dr. Meera', email: 'meera@example.com', passwordHash: pw, role: 'doctor', specialization: 'General Medicine', qualification: 'MBBS', availability: '9am-1pm' });
    const pharmacy = await Pharmacy.create({ name: 'Gram Pharmacy', location: 'Sundarpur Bazaar', contact: '+91-9999999999' });

    await MedicineStock.create({ pharmacyId: pharmacy._id, medicineName: 'Paracetamol', quantity: 50 });
    await MedicineStock.create({ pharmacyId: pharmacy._id, medicineName: 'ORS', quantity: 100 });

    console.log('Seeded:', { patient: patient.email, doctor: doctor.email, pharmacy: pharmacy.name });
    process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });


