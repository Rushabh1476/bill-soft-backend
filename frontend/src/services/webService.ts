import axios from 'axios';
import { API_URL } from '../config/api';

export const webService = {
    submitLead: async (data: { name: string; email: string; phone?: string; message?: string }) => {
        const response = await axios.post(`${API_URL}/web/leads`, data);
        return response.data;
    },

    submitDemoRequest: async (data: { name: string; email: string; phone?: string; companyName?: string }) => {
        const response = await axios.post(`${API_URL}/web/demo-requests`, data);
        return response.data;
    }
};
