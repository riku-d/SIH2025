/**
 * Server-side copy of the escalation terms. The client keeps its own copy
 * for an instant banner, but the server is the authority: voice input is
 * transcribed here, so a spoken "सीने में दर्द" would otherwise never meet
 * a red-flag check at all.
 *
 * Matched against the patient's own words — never the model's — so
 * escalation does not depend on the model choosing to warn.
 */
const RED_FLAGS = [
    // English
    'chest pain', 'chest tightness', "can't breathe", 'cannot breathe', 'trouble breathing',
    'difficulty breathing', 'breathless', 'unconscious', 'fainted', 'seizure', 'fitting',
    'severe bleeding', 'heavy bleeding', 'bleeding heavily', 'coughing blood', 'vomiting blood',
    'blood in stool', 'stroke', 'slurred speech', 'face drooping', 'paralysis', 'numb on one side',
    'suicidal', 'kill myself', 'end my life', 'overdose', 'poisoned', 'snake bite', 'snakebite',
    'severe burn', 'not moving', 'no pulse', 'blue lips', 'stiff neck', 'convulsion',
    // Hindi
    'सीने में दर्द', 'छाती में दर्द', 'साँस नहीं', 'सांस नहीं', 'साँस लेने में', 'बेहोश',
    'दौरा', 'खून बह', 'खून आ', 'लकवा', 'जहर', 'ज़हर', 'साँप ने काटा', 'सांप ने काटा',
    // Punjabi
    'ਛਾਤੀ ਵਿੱਚ ਦਰਦ', 'ਸਾਹ ਨਹੀਂ', 'ਸਾਹ ਲੈਣ', 'ਬੇਹੋਸ਼', 'ਦੌਰਾ', 'ਖ਼ੂਨ ਵਗ', 'ਖੂਨ ਵਗ',
    'ਅਧਰੰਗ', 'ਜ਼ਹਿਰ', 'ਸੱਪ ਨੇ ਡੰਗ'
];

export function hasRedFlag(text) {
    if (!text) return false;
    const lower = String(text).toLowerCase();
    return RED_FLAGS.some(term => lower.includes(term));
}

/** The spoken escalation line, so a user who cannot read still hears it. */
export const ESCALATION_SPOKEN = {
    en: 'What you have described can be serious. Please call one zero eight for an ambulance, or see a doctor now.',
    hi: 'आपने जो बताया है वह गंभीर हो सकता है। कृपया अभी 108 पर एम्बुलेंस बुलाएँ या डॉक्टर को दिखाएँ।',
    pa: 'ਜੋ ਤੁਸੀਂ ਦੱਸਿਆ ਹੈ ਉਹ ਗੰਭੀਰ ਹੋ ਸਕਦਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਹੁਣੇ 108 ਉੱਤੇ ਐਂਬੂਲੈਂਸ ਬੁਲਾਓ ਜਾਂ ਡਾਕਟਰ ਨੂੰ ਵਿਖਾਓ।'
};
