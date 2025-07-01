// src/context/AppContext.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId, subscribeToAuthChanges, getCurrentUserRole } from '../api/firebase'; // Import subscribeToAuthChanges and getCurrentUserRole

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
    const [entities, setEntities] = useState([]);
    const [products, setProducts] = useState([]);
    const [partners, setPartners] = useState([]);
    const [isAppContextLoading, setIsAppContextLoading] = useState(true);
    const [user, setUser] = useState(null); // New state for user
    const [userRole, setUserRole] = useState(null); // New state for user role
    const [isAuthLoading, setIsAuthLoading] = useState(true); // New state for auth loading

    useEffect(() => {
        // Subscribe to authentication changes
        const unsubscribeAuth = subscribeToAuthChanges(({ user, role, isLoading }) => {
            setUser(user);
            setUserRole(role);
            setIsAuthLoading(isLoading);
            if (!isLoading) {
                // If auth loading is complete, and no user, we might be done.
                // Or if user exists, then app loading can proceed.
                // This logic might need refinement based on exact app startup flow.
            }
        });

        // Fetch master data (entities, products, partners)
        const paths = {
            entities: `/artifacts/${appId}/entities`,
            products: `/artifacts/${appId}/products`,
            partners: `/artifacts/${appId}/partners`,
        };
        const unsubscribers = Object.entries(paths).map(([key, path]) => {
            const setter = { entities: setEntities, products: setProducts, partners: setPartners }[key];
            return onSnapshot(query(collection(db, path)), (snapshot) => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                // Only set overall app loading to false once all initial data AND auth state is loaded
                // For simplicity, we'll set it here and rely on isAuthLoading to manage overall app readiness
            });
        });

        // Set isAppContextLoading to false once all initial data fetches are complete AND auth state is determined
        // A more robust solution might involve Promise.all for all initial data fetches + auth state.
        // For now, we'll let individual data fetchers manage their state and combine with authLoading in App.jsx
        setIsAppContextLoading(false); // This marks the end of static data loading

        return () => {
            unsubscribers.forEach(unsub => unsub());
            unsubscribeAuth(); // Unsubscribe from auth changes on unmount
        };
    }, []);

    const value = {
        entities,
        products,
        partners,
        user, // Provide user object
        userRole, // Provide user role
        isLoading: isAppContextLoading || isAuthLoading, // Overall loading state
        isAuthReady: !isAuthLoading, // Indicates if auth state has been determined
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};