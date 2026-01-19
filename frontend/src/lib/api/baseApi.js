import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import useAuthStore from "@/stores/auth.store.js";
import { baseURL } from "../constants.js";

const baseQuery = fetchBaseQuery({
    baseUrl: baseURL,
    credentials: "include", // Send the refresh token with request.
    prepareHeaders: (headers) => {
        const token = useAuthStore.getState().accessToken;
        
        if(token) {
            headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
    }
})
const baseQueryWithReAuth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // If access token is expired
    if(result?.error?.status === 401) {
        // Try refresh
        const refreshResult = await baseQuery(
            {
                url: '/auth/refresh/access-token',
                method: 'POST',
            },
            api,
            extraOptions
        ) // Will give a new Access token as a JSON response

        if(refreshResult?.data?.accessToken) {
            const newToken = refreshResult.data.accessToken;
            
            // Updates the Zustand auth store
            useAuthStore.getState().setAuth(newToken);

            // Retry the request
            result = await baseQuery(args, api, extraOptions); 
        } else {
            useAuthStore.getState().logout();
        }
    }
    return result;
}
export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: baseQueryWithReAuth,
    tagTypes: ["User", "Post", "Comment", "Notification"],
    endpoints: () => ({})
});