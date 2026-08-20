/**
 * The one list of consultation slots.
 *
 * timeSlot was a free-text string, so the same hour arrived as "3pm",
 * "15:00" and "3-4 PM" depending on who typed it — which makes the
 * double-booking check unreliable, because two spellings of one hour do not
 * collide. A fixed vocabulary makes the slot comparable, lets the patient
 * request a real time instead of only a date, and lets the doctor accept in
 * one tap instead of retyping it.
 */
export const SLOTS = [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
    '17:00-18:00',
    '18:00-19:00'
];

export const isValidSlot = (slot) => SLOTS.includes(slot);

/** Start of the slot on a given date, used to tell past slots from future. */
export function slotStart(date, slot) {
    const [hours, minutes] = slot.split('-')[0].split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
}
