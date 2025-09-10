import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice"
import tripReducer from "./tripSlice"


export const store = configureStore({
    reducer: {
        auth: authReducer,
        trip: tripReducer
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoreActions: ["persist/PERSIST"],
            },
        }),
});

export default store;








