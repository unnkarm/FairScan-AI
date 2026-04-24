import axios from "axios";

const BASE_URL = "http://localhost:8000";

// 1. Upload file
export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    `${BASE_URL}/upload`,
    formData
  );

  return res.data;
};

// 2. Analyze bias (NO file here)
export const analyzeCSV = async (payload) => {
  const res = await axios.post("http://localhost:8000/analyze", payload);
  return res.data;
};

// 3. Explain bias
export const explainBias = async (payload) => {
  const res = await axios.post("http://localhost:8000/explain", payload);
  return res.data;
};