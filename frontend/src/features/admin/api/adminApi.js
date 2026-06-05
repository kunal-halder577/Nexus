import { baseApi } from "@/lib/api/baseApi";

const adminApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDashboard: builder.query({
            query: () => "/admin/dashboard",
            providesTags: ["admin-dashboard"],
        }),
        getAuditLogs: builder.query({
            query: (params = {}) => ({ url: "/admin/audit-logs", params }),
            providesTags: ["admin-audit-logs"],
        }),
        getAllUsers: builder.query({
            query: (params = {}) => ({ url: "/admin/users", params }),
            providesTags: ["admin-users"],
        }),
        assignRole: builder.mutation({
            query: ({ id, role }) => ({
                url: `/admin/users/assign-role/${id}`,
                method: "PATCH",
                body: { role },
            }),
            invalidatesTags: ["admin-users"],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/admin/users/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["admin-users"],
        }),
        banOrUnbanUser: builder.mutation({
            query: ({ id, action }) => ({
                url: `/admin/users/${action}/${id}`,
                method: "PATCH",
            }),
            invalidatesTags: ["admin-users"],
        }),
        editUserProfile: builder.mutation({
            query: ({ id, profile }) => ({
                url: `/admin/users/edit/${id}`,
                method: "PATCH",
                body: profile,
            }),
            invalidatesTags: (result, error, { id }) => ["admin-users", { type: 'User', id }],
        }),
    }),
});

export const { 
    useGetDashboardQuery, 
    useGetAuditLogsQuery, 
    useGetAllUsersQuery, 
    useAssignRoleMutation, 
    useDeleteUserMutation, useBanOrUnbanUserMutation, useEditUserProfileMutation 
} = adminApi;