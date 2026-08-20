/**
 * Curated reference the model is told to prefer over its own recollection.
 *
 * Deliberately small and India-specific: national helpline numbers, the
 * conditions a PHC actually sees, and the lab panels that come back from a
 * district lab. Written in plain language because it is retrieved and then
 * paraphrased for someone with limited medical knowledge.
 *
 * Sources are named per entry so the answer can cite them.
 */
export const FIRST_AID_CORPUS = [
    {
        id: 'fa-fever',
        title: 'Fever in adults',
        source: 'WHO / ICMR first aid guidance',
        text: `Fever is the body fighting an infection. Rest and drink plenty of fluids — water, ORS, rice water, or coconut water. A cool damp cloth on the forehead helps comfort. Paracetamol is the usual medicine for fever in India and is sold without prescription, but the dose depends on age and weight, so ask a pharmacist or doctor. See a doctor the same day if fever is above 39C, lasts more than three days, comes with a stiff neck, a rash that does not fade when pressed, severe headache, confusion, or difficulty breathing. In malaria and dengue areas, any fever with severe body pain, bleeding gums, or black stools needs urgent testing.`
    },
    {
        id: 'fa-diarrhoea',
        title: 'Diarrhoea and dehydration',
        source: 'WHO ORS guidance',
        text: `The danger in diarrhoea is losing water, not the diarrhoea itself. Give ORS solution after every loose stool. Home mix if no ORS sachet: six level teaspoons of sugar and half a teaspoon of salt in one litre of clean water. Keep eating normally. Zinc supplements for 14 days shorten diarrhoea in children. Go to a clinic urgently for: blood in the stool, no urine for eight hours, sunken eyes, very dry mouth, a child who is unusually sleepy or cannot be woken, or vomiting that prevents any fluids staying down.`
    },
    {
        id: 'fa-emergency',
        title: 'When to call an ambulance',
        source: 'National Health Portal India',
        text: `Call 108 for a free ambulance anywhere in India. 112 is the all-services emergency number and 104 is the health helpline. Call immediately for: chest pain or pressure, difficulty breathing, sudden weakness or numbness on one side, face drooping, slurred speech, a seizure that does not stop, unconsciousness, heavy bleeding that does not stop with pressure, snake bite, poisoning, severe burns, or a serious fall from height. While waiting, keep the person still, loosen tight clothing, and do not give food or water to anyone who is drowsy or unconscious.`
    },
    {
        id: 'fa-snakebite',
        title: 'Snake bite',
        source: 'National Snakebite Management Protocol, India',
        text: `Snake bite is a medical emergency. Keep the person calm and still — movement spreads venom. Immobilise the bitten limb like a fracture and keep it below heart level. Remove rings, bangles and watches before swelling starts. Get to a hospital with anti-snake venom immediately; call 108. Do NOT cut the wound, suck out venom, apply a tight tourniquet, apply ice, or give any traditional remedy. Try to remember the snake's colour and shape, but do not chase or catch it.`
    },
    {
        id: 'fa-burns',
        title: 'Burns and scalds',
        source: 'WHO burn first aid',
        text: `Cool the burn under clean running water for 20 minutes. Do not use ice, toothpaste, oil, butter, ash or turmeric — these trap heat and cause infection. Remove clothing and jewellery near the burn unless it is stuck to the skin. Cover loosely with a clean cloth or cling film. Go to hospital for: burns bigger than the person's palm, burns on face, hands, feet, joints or genitals, deep or white or charred burns, electrical or chemical burns, or any burn in a small child or elderly person.`
    },
    {
        id: 'fa-pregnancy-danger',
        title: 'Danger signs in pregnancy',
        source: 'Ministry of Health and Family Welfare, India',
        text: `Go to a health facility immediately for any of these during pregnancy: bleeding from the vagina, severe headache with blurred vision, convulsions or fits, high fever, severe abdominal pain, reduced or absent baby movements after the sixth month, water breaking before nine months, or swelling of the face and hands. Regular antenatal check-ups, iron and folic acid tablets, and two tetanus injections are part of routine care and are free at government facilities.`
    },
    {
        id: 'lab-cbc',
        title: 'Complete blood count reference ranges',
        source: 'Common Indian laboratory reference ranges',
        text: `Typical adult ranges: Haemoglobin 13-17 g/dL for men and 12-15 g/dL for women; below this suggests anaemia, which is very common in India and often due to iron deficiency. Total white cell count 4,000-11,000 per microlitre; higher can mean infection, lower can follow viral illness. Platelets 1.5-4.5 lakh per microlitre; a falling platelet count with fever raises concern for dengue. These ranges vary slightly between laboratories, and a single value out of range is not a diagnosis on its own.`
    },
    {
        id: 'lab-sugar',
        title: 'Blood sugar and HbA1c reference ranges',
        source: 'Common Indian laboratory reference ranges',
        text: `Fasting blood glucose below 100 mg/dL is normal, 100-125 mg/dL is prediabetes, and 126 mg/dL or above on two occasions suggests diabetes. Post-meal (two hours) below 140 mg/dL is normal and 200 mg/dL or above suggests diabetes. HbA1c reflects the average of about three months: below 5.7 percent normal, 5.7-6.4 percent prediabetes, 6.5 percent or above suggests diabetes. Interpreting these and starting any treatment is a doctor's decision.`
    },
    {
        id: 'lab-lipid',
        title: 'Lipid profile reference ranges',
        source: 'Common Indian laboratory reference ranges',
        text: `Desirable values: total cholesterol below 200 mg/dL, LDL (the harmful one) below 100 mg/dL, HDL (the protective one) above 40 mg/dL for men and above 50 mg/dL for women, and triglycerides below 150 mg/dL. Values are read together with age, blood pressure, smoking and family history rather than one at a time. Diet, walking and stopping tobacco move these numbers before any medicine is considered.`
    },
    {
        id: 'fa-tb',
        title: 'Persistent cough and tuberculosis',
        source: 'National Tuberculosis Elimination Programme, India',
        text: `A cough lasting more than two weeks should be tested for tuberculosis, especially with evening fever, night sweats, weight loss, chest pain, or blood in the sputum. Sputum testing and TB treatment are free at government health facilities under the national programme, and treatment works well when the full course is completed. Stopping treatment early is what causes drug-resistant TB. Anyone living in the same house should also be checked.`
    }
];
