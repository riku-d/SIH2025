/**
 * The answer of last resort.
 *
 * Grown from the keyword matcher that used to live in symptomCheckerController
 * and was never wired to anything. It is not a model and does not pretend to
 * be: when the network or the model is unavailable, a handful of correct,
 * pre-written first-aid answers beats an error message — which is the whole
 * of the offline story we should claim.
 */
const RULES = [
    {
        match: ['fever', 'बुखार', 'ਬੁਖ਼ਾਰ', 'ਬੁਖਾਰ', 'temperature'],
        en: 'Rest and drink plenty of fluids — water, ORS or coconut water. A cool damp cloth on the forehead helps. See a doctor if the fever lasts more than three days, goes above 39C, or comes with a stiff neck, rash or difficulty breathing.',
        hi: 'आराम करें और खूब तरल पिएं — पानी, ओआरएस या नारियल पानी। माथे पर ठंडी गीली पट्टी रखें। अगर बुखार तीन दिन से ज़्यादा रहे, बहुत तेज़ हो, या गर्दन में अकड़न, दाने या साँस लेने में तकलीफ़ हो तो डॉक्टर को दिखाएँ।',
        pa: 'ਆਰਾਮ ਕਰੋ ਅਤੇ ਬਹੁਤ ਤਰਲ ਪੀਓ — ਪਾਣੀ, ਓਆਰਐਸ ਜਾਂ ਨਾਰੀਅਲ ਪਾਣੀ। ਮੱਥੇ ਉੱਤੇ ਠੰਢੀ ਗਿੱਲੀ ਪੱਟੀ ਰੱਖੋ। ਜੇ ਬੁਖ਼ਾਰ ਤਿੰਨ ਦਿਨਾਂ ਤੋਂ ਵੱਧ ਰਹੇ ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼ ਹੋਵੇ ਤਾਂ ਡਾਕਟਰ ਨੂੰ ਵਿਖਾਓ।'
    },
    {
        match: ['diarrhea', 'diarrhoea', 'loose motion', 'दस्त', 'पतले दस्त', 'ਦਸਤ', 'vomit', 'उल्टी', 'ਉਲਟੀ'],
        en: 'Give ORS after every loose stool. No sachet? Mix six level teaspoons of sugar and half a teaspoon of salt in one litre of clean water. Keep eating normally. Go to a clinic urgently if there is blood in the stool, no urine for eight hours, sunken eyes, or the person cannot keep any fluid down.',
        hi: 'हर पतले दस्त के बाद ओआरएस दें। पैकेट न हो तो एक लीटर साफ़ पानी में छह चम्मच चीनी और आधा चम्मच नमक मिलाएँ। खाना सामान्य रूप से जारी रखें। दस्त में खून आए, आठ घंटे पेशाब न हो, आँखें धँसी हों, या कुछ भी पेट में न रुके तो तुरंत क्लीनिक जाएँ।',
        pa: 'ਹਰ ਪਤਲੇ ਦਸਤ ਤੋਂ ਬਾਅਦ ਓਆਰਐਸ ਦਿਓ। ਪੈਕਟ ਨਾ ਹੋਵੇ ਤਾਂ ਇੱਕ ਲੀਟਰ ਸਾਫ਼ ਪਾਣੀ ਵਿੱਚ ਛੇ ਚਮਚ ਖੰਡ ਅਤੇ ਅੱਧਾ ਚਮਚ ਲੂਣ ਮਿਲਾਓ। ਖਾਣਾ ਆਮ ਵਾਂਗ ਜਾਰੀ ਰੱਖੋ। ਖ਼ੂਨ ਆਵੇ ਜਾਂ ਅੱਠ ਘੰਟੇ ਪਿਸ਼ਾਬ ਨਾ ਆਵੇ ਤਾਂ ਤੁਰੰਤ ਕਲੀਨਿਕ ਜਾਓ।'
    },
    {
        match: ['burn', 'जल गया', 'जल गयी', 'जलन', 'ਸੜ ਗਿਆ', 'ਸਾੜ'],
        en: 'Cool the burn under clean running water for 20 minutes. Do not put ice, toothpaste, oil, butter or ash on it. Cover loosely with a clean cloth. Go to hospital if the burn is bigger than the palm, on the face, hands or genitals, or looks white or charred.',
        hi: 'जले हुए हिस्से को 20 मिनट तक साफ़ बहते पानी के नीचे रखें। बर्फ़, टूथपेस्ट, तेल, मक्खन या राख न लगाएँ। साफ़ कपड़े से ढीला ढक दें। अगर जला हिस्सा हथेली से बड़ा हो, चेहरे या हाथों पर हो, या सफ़ेद दिखे तो अस्पताल जाएँ।',
        pa: 'ਸੜੇ ਹਿੱਸੇ ਨੂੰ 20 ਮਿੰਟ ਸਾਫ਼ ਵਗਦੇ ਪਾਣੀ ਹੇਠ ਰੱਖੋ। ਬਰਫ਼, ਟੂਥਪੇਸਟ, ਤੇਲ ਜਾਂ ਸੁਆਹ ਨਾ ਲਾਓ। ਸਾਫ਼ ਕੱਪੜੇ ਨਾਲ ਢਿੱਲਾ ਢੱਕੋ। ਜੇ ਸੜਿਆ ਹਿੱਸਾ ਹਥੇਲੀ ਤੋਂ ਵੱਡਾ ਹੋਵੇ ਤਾਂ ਹਸਪਤਾਲ ਜਾਓ।'
    },
    {
        match: ['snake', 'साँप', 'सांप', 'ਸੱਪ'],
        en: 'Snake bite is an emergency — call 108 now. Keep the person still and the bitten limb below heart level. Remove rings and bangles. Do NOT cut the wound, suck the venom, apply a tourniquet or use any traditional remedy.',
        hi: 'साँप का काटना आपात स्थिति है — अभी 108 पर कॉल करें। व्यक्ति को शांत और स्थिर रखें, काटा हुआ अंग दिल से नीचे रखें। अंगूठी और चूड़ियाँ उतार दें। घाव को काटें नहीं, ज़हर चूसें नहीं, कसकर बाँधें नहीं।',
        pa: 'ਸੱਪ ਦਾ ਡੰਗ ਐਮਰਜੈਂਸੀ ਹੈ — ਹੁਣੇ 108 ਉੱਤੇ ਕਾਲ ਕਰੋ। ਵਿਅਕਤੀ ਨੂੰ ਸ਼ਾਂਤ ਅਤੇ ਸਥਿਰ ਰੱਖੋ। ਮੁੰਦਰੀਆਂ ਅਤੇ ਚੂੜੀਆਂ ਲਾਹ ਦਿਓ। ਜ਼ਖ਼ਮ ਨਾ ਕੱਟੋ, ਜ਼ਹਿਰ ਨਾ ਚੂਸੋ, ਕੱਸ ਕੇ ਨਾ ਬੰਨ੍ਹੋ।'
    }
];

const FALLBACK = {
    en: 'I cannot reach the assistant right now. If this is urgent, call 108 for an ambulance or 104 for the health helpline. Otherwise please try again when you have a signal, or book a doctor.',
    hi: 'मैं अभी सहायक तक नहीं पहुँच पा रहा। अगर यह ज़रूरी है तो 108 पर एम्बुलेंस या 104 पर स्वास्थ्य हेल्पलाइन को कॉल करें। नहीं तो नेटवर्क आने पर फिर कोशिश करें, या डॉक्टर से समय लें।',
    pa: 'ਮੈਂ ਹੁਣੇ ਸਹਾਇਕ ਤੱਕ ਨਹੀਂ ਪਹੁੰਚ ਸਕਦਾ। ਜੇ ਇਹ ਜ਼ਰੂਰੀ ਹੈ ਤਾਂ 108 ਉੱਤੇ ਐਂਬੂਲੈਂਸ ਜਾਂ 104 ਉੱਤੇ ਸਿਹਤ ਹੈਲਪਲਾਈਨ ਨੂੰ ਕਾਲ ਕਰੋ। ਨਹੀਂ ਤਾਂ ਸਿਗਨਲ ਆਉਣ ਉੱਤੇ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
    };

export function offlineAnswer(text, lang = 'en') {
    const locale = ['en', 'hi', 'pa'].includes(lang) ? lang : 'en';
    const lower = String(text || '').toLowerCase();
    const rule = RULES.find(r => r.match.some(k => lower.includes(k)));
    return { text: rule ? rule[locale] : FALLBACK[locale], offline: true, matched: Boolean(rule) };
}

/** Shipped to the client so it can answer with no network at all. */
export function offlinePack(lang = 'en') {
    const locale = ['en', 'hi', 'pa'].includes(lang) ? lang : 'en';
    return {
        fallback: FALLBACK[locale],
        rules: RULES.map(r => ({ match: r.match, text: r[locale] }))
    };
}
