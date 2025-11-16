"use server";

import { revalidatePath } from "next/cache";
import { TaskInput } from "../validations/task.schema";

const API_URL = process.env.API_URL || "http://localhost:4000/api";

async function fetchWithAuth(
  endpoint: string,
  token: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  return response;
}

export async function getTasksAction(
  token: string,
  refreshToken: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    let response = await fetchWithAuth(
      `/tasks?${queryParams.toString()}`,
      token,
    );

    // Handle token refresh
    if (response.status === 401) {
      const refreshResult = await refreshAccessToken(refreshToken);
      if (!refreshResult.success) {
        return { success: false, error: "Session expired", needsLogin: true };
      }

      // Retry with new token
      response = await fetchWithAuth(
        `/tasks?${queryParams.toString()}`,
        refreshResult.accessToken!,
      );

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.message };
      }

      return {
        success: true,
        data: result.data,
        newAccessToken: refreshResult.accessToken,
      };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.log(error, "erro while fetching tasks");
    return { success: false, error: "Failed to fetch tasks" };
  }
}

export async function createTaskAction(
  token: string,
  refreshToken: string,
  data: TaskInput,
) {
  try {
    let response = await fetchWithAuth("/tasks", token, {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Handle token refresh
    if (response.status === 401) {
      const refreshResult = await refreshAccessToken(refreshToken);
      if (!refreshResult.success) {
        return { success: false, error: "Session expired", needsLogin: true };
      }

      response = await fetchWithAuth("/tasks", refreshResult.accessToken!, {
        method: "POST",
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.message };
      }

      revalidatePath("/dashboard");
      return {
        success: true,
        data: result.data,
        newAccessToken: refreshResult.accessToken,
      };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTaskAction(
  token: string,
  refreshToken: string,
  id: string,
  data: Partial<TaskInput>,
) {
  try {
    let response = await fetchWithAuth(`/tasks/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      const refreshResult = await refreshAccessToken(refreshToken);
      if (!refreshResult.success) {
        return { success: false, error: "Session expired", needsLogin: true };
      }

      response = await fetchWithAuth(
        `/tasks/${id}`,
        refreshResult.accessToken!,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.message };
      }

      revalidatePath("/dashboard");
      return {
        success: true,
        data: result.data,
        newAccessToken: refreshResult.accessToken,
      };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTaskAction(
  token: string,
  refreshToken: string,
  id: string,
) {
  try {
    let response = await fetchWithAuth(`/tasks/${id}`, token, {
      method: "DELETE",
    });

    if (response.status === 401) {
      const refreshResult = await refreshAccessToken(refreshToken);
      if (!refreshResult.success) {
        return { success: false, error: "Session expired", needsLogin: true };
      }

      response = await fetchWithAuth(
        `/tasks/${id}`,
        refreshResult.accessToken!,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const result = await response.json();
        return { success: false, error: result.message };
      }

      revalidatePath("/dashboard");
      return { success: true, newAccessToken: refreshResult.accessToken };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete task" };
  }
}

export async function toggleTaskAction(
  token: string,
  refreshToken: string,
  id: string,
) {
  try {
    let response = await fetchWithAuth(`/tasks/${id}/toggle`, token, {
      method: "POST",
    });

    if (response.status === 401) {
      const refreshResult = await refreshAccessToken(refreshToken);
      if (!refreshResult.success) {
        return { success: false, error: "Session expired", needsLogin: true };
      }

      response = await fetchWithAuth(
        `/tasks/${id}/toggle`,
        refreshResult.accessToken!,
        {
          method: "POST",
        },
      );

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.message };
      }

      revalidatePath("/dashboard");
      return {
        success: true,
        data: result.data,
        newAccessToken: refreshResult.accessToken,
      };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: "Failed to toggle task" };
  }
}

async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const result = await response.json();
    return { success: true, accessToken: result.data.accessToken };
  } catch (error) {
    return { success: false };
  }
}
