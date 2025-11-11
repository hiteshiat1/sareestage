// --- MOCK USER DATA SERVICE ---
// Manages user-specific data like credits and subscription plans.
// Uses localStorage to persist data for both guests and logged-in users.

export interface UserData {
  credits: number;
  plan: string; // e.g., 'guest', 'spark', 'enthusiast'
}

const GUEST_USER_ID_KEY = 'sareestage_guest_id';
const USER_DATA_KEY_PREFIX = 'sareestage_userdata_';
const FREE_GUEST_CREDITS = 3;

// --- Helper Functions ---

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const getAllUserData = (): { [key: string]: UserData } => {
    const allDataJson = localStorage.getItem(USER_DATA_KEY_PREFIX);
    return allDataJson ? JSON.parse(allDataJson) : {};
}

const saveAllUserData = (allData: { [key: string]: UserData }) => {
    localStorage.setItem(USER_DATA_KEY_PREFIX, JSON.stringify(allData));
}


// --- Public API ---

/**
 * Gets or creates a unique ID for a guest user and stores it in localStorage.
 */
export const getGuestId = (): string => {
    let guestId = localStorage.getItem(GUEST_USER_ID_KEY);
    if (!guestId) {
        guestId = `guest_${generateUUID()}`;
        localStorage.setItem(GUEST_USER_ID_KEY, guestId);
    }
    return guestId;
}

/**
 * Retrieves the data for a specific user (guest or logged-in).
 * If it's a new guest, initializes them with free credits.
 */
export const getUserData = (userId: string): UserData | null => {
    const allData = getAllUserData();
    let userData = allData[userId];
    
    // If user is a guest and has no data, initialize them.
    if (!userData && userId.startsWith('guest_')) {
        userData = { credits: FREE_GUEST_CREDITS, plan: 'guest' };
        updateUserData(userId, userData);
    }
    
    return userData || null;
}

/**
 * Updates and saves the data for a specific user.
 */
export const updateUserData = (userId: string, data: UserData) => {
    const allData = getAllUserData();
    allData[userId] = data;
    saveAllUserData(allData);
}

/**
 * Initializes a newly signed-up user with 0 credits.
 */
export const initializeUser = (userId: string) => {
    const allData = getAllUserData();
    // Only initialize if they don't already have data
    if (!allData[userId]) {
        allData[userId] = { credits: 0, plan: 'free_tier' };
        saveAllUserData(allData);
    }
}