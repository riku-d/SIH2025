import PDFDocument from 'pdfkit';
import HealthRecord from '../models/HealthRecord.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

export const createRecord = async (req, res) => {
    try {
        const { patientId, appointmentId, diagnosis, prescription } = req.body;
        const rec = await HealthRecord.create({ patientId, appointmentId, diagnosis, prescription });
        res.status(201).json(rec);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getRecordsForPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const records = await HealthRecord.find({ patientId }).sort({ createdAt: -1 });
        res.json(records);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const downloadPatientHistoryPdf = async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await User.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        const records = await HealthRecord.find({ patientId }).populate('appointmentId');

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=health_records_${patientId}.pdf`);
        doc.pipe(res);
        doc.fontSize(18).text(`Patient: ${patient.name}`, { underline: true });
        doc.moveDown();
        records.forEach((r) => {
            doc.fontSize(12).text(`Date: ${new Date(r.createdAt).toLocaleString()}`);
            doc.text(`Diagnosis: ${r.diagnosis}`);
            doc.text(`Prescription: ${r.prescription || '-'}`);
            doc.moveDown();
        });
        doc.end();
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};


