import * as SecureStore from 'expo-secure-store';

const USERS_KEY = 'flixhub_users';
const CURRENT_USER_KEY = 'flixhub_current_user';

export const signUp = async (email, password) => {
    const normalizedEmail = email.toLowerCase();
    try {
        const existingUsersJson = await SecureStore.getItemAsync(USERS_KEY);
        let users = [];
        try {
            users = existingUsersJson ? JSON.parse(existingUsersJson) : [];
            if (!Array.isArray(users)) users = [];
        } catch (e) {
            console.error('Failed to parse users list, resetting');
            users = [];
        }

        if (users.find(u => u.email === normalizedEmail)) {
            throw new Error('User already exists');
        }

        const newUser = { email: normalizedEmail, password };
        users.push(newUser);
        await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));

        // Auto login
        await login(normalizedEmail, password);
        return newUser;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
};

export const login = async (email, password) => {
    const normalizedEmail = email.toLowerCase();
    try {
        const usersJson = await SecureStore.getItemAsync(USERS_KEY);
        let users = [];
        try {
            users = usersJson ? JSON.parse(usersJson) : [];
            if (!Array.isArray(users)) users = [];
        } catch (e) {
            console.error('Failed to parse users list');
            users = [];
        }

        const user = users.find(u => u.email === normalizedEmail && u.password === password);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = async () => {
    await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
};

export const getCurrentUser = async () => {
    const userJson = await SecureStore.getItemAsync(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};
