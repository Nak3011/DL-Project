/**
 * API client — typed wrapper around the backend prediction endpoint.
 */

import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface PredictionResponse {
  confidence: number;
  predicted_class: number;
  latitude: number;
  longitude: number;
  aqi: number;
  aqi_status: string;
}

/**
 * Send an image to the backend for wildfire prediction.
 *
 * @param file - The image `File` object to upload.
 * @returns Parsed prediction response from the API.
 */
export async function predict(file: File): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axios.post<PredictionResponse>(
    `${API_BASE}/predict`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000, // model inference may take a moment
    }
  );

  return data;
}
