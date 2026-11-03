import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest, apiClient } from "../api-client";
import { ApiError } from "../api-error";

describe("api-client and ApiError", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully parses a standard 200 JSON response envelope", async () => {
    const mockData = { success: true, data: { id: 1, name: "Electronics" } };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await apiRequest<typeof mockData>("/categories");
    expect(result).toEqual(mockData);
  });

  it("correctly handles 204 No Content by returning undefined", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );

    const result = await apiRequest<void>("/products/1", { method: "DELETE" });
    expect(result).toBeUndefined();
  });

  it("throws ApiError with parsed backend error envelope on 400 Bad Request", async () => {
    const errorPayload = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid SKU format.",
        details: [{ path: ["sku"], message: "SKU must be uppercase" }],
      },
      requestId: "req-12345",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(errorPayload), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    try {
      await apiClient.post("/products", { sku: "bad-sku" });
      expect.fail("Expected apiRequest to throw an ApiError");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe("VALIDATION_ERROR");
      expect(apiErr.message).toBe("Invalid SKU format.");
      expect(apiErr.requestId).toBe("req-12345");
      expect(apiErr.isValidation()).toBe(true);
      expect(apiErr.isUnauthorized()).toBe(false);
    }
  });

  it("throws ApiError on 401 Unauthorized with isUnauthorized() returning true", async () => {
    const errorPayload = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid token.",
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(errorPayload), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    try {
      await apiClient.get("/auth/me");
      expect.fail("Expected ApiError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(401);
      expect(apiErr.isUnauthorized()).toBe(true);
      expect(apiErr.isForbidden()).toBe(false);
    }
  });

  it("attaches the Bearer token when passed in options", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiRequest("/categories", { token: "test-jwt-token" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-jwt-token");
  });

  it("handles network failure and wraps in an ApiError with status 0", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Failed to fetch"));

    try {
      await apiRequest("/health/live");
      expect.fail("Expected network error");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.code).toBe("NETWORK_ERROR");
    }
  });
});

