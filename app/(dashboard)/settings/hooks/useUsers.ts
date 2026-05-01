import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, User } from "@/lib/types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      let page = 1;
      let lastPage = 1;
      const all: User[] = [];

      while (page <= lastPage) {
        const res = await api.get<ApiResponse<User[]>>("/users", {
          params: { per_page: 100, page },
        });
        all.push(...res.data.data);
        const pagination = (res.data.meta as { pagination?: { last_page?: number } })?.pagination;
        lastPage = pagination?.last_page ?? 1;
        page += 1;
      }
      return all;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User> & { password?: string }) => {
      const res = await api.post<ApiResponse<User>>("/users", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<User> & { id: number }) => {
      const res = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
