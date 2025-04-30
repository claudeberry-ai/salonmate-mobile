import axios from 'axios';
import Config from '../constants/backend';

const API_BASE_URL = Config.BACKEND_URL;

export const uploadWithImg = async (url: string, data: object) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${url}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Update Error:', error);
    throw error;
  }
};

export const postReq = async (url: string, details: object) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${url}`, details);
    return response.data;
  } catch (error) {
    console.error('Update Error:', error);
    throw error;
  }
};
export const putReq = async (url: string, details: object) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${url}`, details);
    return response.data;
  } catch (error) {
    console.error('Update Error:', error);
    throw error;
  }
};

export const getReq = async (url: string) => {

  try {
    const response = await axios.get(`${API_BASE_URL}/${url}`);
    return response.data;
  } catch (error) {
    console.error('Update Error:', error);
    throw error;
  }
};
