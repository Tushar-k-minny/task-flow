"use server";

import { LoginInput, RegisterInput } from "../validations/auth.schema";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:5000/api";

export async function loginAction(data: LoginInput) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Login failed",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: "An error occurred. Please try again.",
    };
  }
}

export async function registerAction(data: RegisterInput) {
  try {
    const { confirmPassword, ...registerData } = data;

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Registration failed",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: "An error occurred. Please try again.",
    };
  }
}

export async function logoutAction(refreshToken: string) {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
