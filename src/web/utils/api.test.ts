import { handleAPIResponse } from "./api";

describe("handleAPIResponse", () => {
  it("should handle a successful response", async () => {
    const mockResponse = {
      status: 200,
      json: jest.fn().mockResolvedValue({ data: "test data" }),
    } as unknown as Response;

    const result = await handleAPIResponse<{ data: string }>(mockResponse);

    expect(result).toEqual({ data: "test data" });
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
  });

  it("should throw an error for a response with status >= 300", async () => {
    const mockResponse = {
      status: 404,
      json: jest.fn().mockResolvedValue({ error: "Not found" }),
    } as unknown as Response;

    await expect(handleAPIResponse(mockResponse)).rejects.toThrow("Not found");
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
  });

  it("should handle a response with no error property", async () => {
    const mockResponse = {
      status: 400,
      json: jest.fn().mockResolvedValue({ message: "Bad request" }),
    } as unknown as Response;

    await expect(handleAPIResponse(mockResponse)).rejects.toThrow("");
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
  });
});
