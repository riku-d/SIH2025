// Very simple rules-based symptom checker for MVP
const rules = [
    { keywords: ['fever', 'cough', 'cold'], condition: 'Common Cold/Flu', advice: 'Rest, fluids; consult if persists >3 days.' },
    { keywords: ['chest pain', 'breathless', 'breathlessness'], condition: 'Possible Cardiac/Respiratory Issue', advice: 'Consult doctor immediately.' },
    { keywords: ['diarrhea', 'vomit', 'stomach'], condition: 'Gastroenteritis', advice: 'Oral rehydration; consult if severe.' },
    { keywords: ['headache', 'migraine'], condition: 'Migraine/Headache', advice: 'Hydration and rest; consult if recurrent.' },
    { keywords: ['rash', 'itch'], condition: 'Skin Allergy', advice: 'Avoid irritants; consult if spreading.' }
];

export const querySymptoms = async (req, res) => {
    try {
        const { text } = req.body;
        const lower = (text || '').toLowerCase();
        const matches = rules.filter(r => r.keywords.some(k => lower.includes(k)));
        if (matches.length === 0) {
            return res.json({ suggestions: [{ condition: 'Unknown', advice: 'If symptoms persist, consult a doctor.' }] });
        }
        return res.json({ suggestions: matches.map(m => ({ condition: m.condition, advice: m.advice })) });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};


