import { marked } from 'marked'

/**
 * Terms that mean "stop reading and get help". Matched against the
 * user's own words, not the model's, so the escalation banner does not
 * depend on the model choosing to include a warning.
 */
const RED_FLAGS = [
  // English
  'chest pain', 'chest tightness', 'can\'t breathe', 'cannot breathe', 'trouble breathing',
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
]

export function hasRedFlag(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return RED_FLAGS.some(term => lower.includes(term))
}

/**
 * `marked` passes raw HTML through by default, and its output was going
 * straight into dangerouslySetInnerHTML. Model output is shaped by user
 * input including uploaded documents, so escaping the angle brackets
 * before parsing removes the injection path entirely — markdown's own
 * syntax never needs them.
 */
export function renderMarkdownSafely(text) {
  if (!text) return ''
  const escaped = String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return marked.parse(escaped, { breaks: true, gfm: true })
}
