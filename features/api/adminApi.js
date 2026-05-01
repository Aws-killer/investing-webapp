import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery,
  tagTypes: ["AdminDashboard", "AdminFund", "AdminFAQ", "AdminUsers", "CorporateActions", "Learning"],
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => "/admin/dashboard",
      providesTags: ["AdminDashboard"],
      transformResponse: (response) => response.data ?? {},
    }),
    getAdminFAQs: builder.query({
      query: () => "/admin/fund-faqs",
      providesTags: ["AdminFAQ"],
      transformResponse: (response) => response.data ?? [],
    }),
    getAdminFunds: builder.query({
      query: () => "/admin/funds",
      providesTags: ["AdminFund"],
      transformResponse: (response) => response.data ?? [],
    }),
    updateFundInfo: builder.mutation({
      query: ({ fundId, ...body }) => ({
        url: `/admin/funds/${fundId}/info`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AdminFund"],
    }),
    createAdminFAQ: builder.mutation({
      query: (body) => ({ url: "/admin/fund-faqs", method: "POST", body }),
      invalidatesTags: ["AdminFAQ"],
    }),
    updateAdminFAQ: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/fund-faqs/${id}`, method: "PUT", body }),
      invalidatesTags: ["AdminFAQ"],
    }),
    deleteAdminFAQ: builder.mutation({
      query: (id) => ({ url: `/admin/fund-faqs/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminFAQ"],
    }),
    refreshFunds: builder.mutation({
      query: (manager) => ({ url: `/admin/funds/refresh/${manager}`, method: "POST" }),
      invalidatesTags: ["AdminDashboard"],
    }),
    getAdminUsers: builder.query({
      query: () => "/admin/users",
      providesTags: ["AdminUsers"],
      transformResponse: (response) => response.data ?? [],
    }),
    setTemporaryPassword: builder.mutation({
      query: ({ userId, ...body }) => ({
        url: `/admin/users/${userId}/temporary-password`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    addSupportNote: builder.mutation({
      query: ({ userId, note }) => ({
        url: `/admin/users/${userId}/support-notes`,
        method: "POST",
        body: { note },
      }),
    }),
    getCorporateActions: builder.query({
      query: () => "/admin/corporate-actions",
      providesTags: ["CorporateActions"],
      transformResponse: (response) => response.data ?? [],
    }),
    createCorporateAction: builder.mutation({
      query: (body) => ({ url: "/admin/corporate-actions", method: "POST", body }),
      invalidatesTags: ["CorporateActions"],
    }),
    getLearningArticles: builder.query({
      query: () => "/admin/learning/articles",
      providesTags: ["Learning"],
      transformResponse: (response) => response.data ?? [],
    }),
    createLearningArticle: builder.mutation({
      query: (body) => ({ url: "/admin/learning/articles", method: "POST", body }),
      invalidatesTags: ["Learning"],
    }),
    getLearningQuizzes: builder.query({
      query: () => "/admin/learning/quizzes",
      providesTags: ["Learning"],
      transformResponse: (response) => response.data ?? [],
    }),
    createLearningQuiz: builder.mutation({
      query: (body) => ({ url: "/admin/learning/quizzes", method: "POST", body }),
      invalidatesTags: ["Learning"],
    }),
    createLearningQuestion: builder.mutation({
      query: ({ quizId, ...body }) => ({
        url: `/admin/learning/quizzes/${quizId}/questions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminFAQsQuery,
  useGetAdminFundsQuery,
  useUpdateFundInfoMutation,
  useCreateAdminFAQMutation,
  useUpdateAdminFAQMutation,
  useDeleteAdminFAQMutation,
  useRefreshFundsMutation,
  useGetAdminUsersQuery,
  useSetTemporaryPasswordMutation,
  useAddSupportNoteMutation,
  useGetCorporateActionsQuery,
  useCreateCorporateActionMutation,
  useGetLearningArticlesQuery,
  useCreateLearningArticleMutation,
  useGetLearningQuizzesQuery,
  useCreateLearningQuizMutation,
  useCreateLearningQuestionMutation,
} = adminApi;
