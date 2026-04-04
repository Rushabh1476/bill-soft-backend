import { HttpClient } from '../interfaces/http';

export interface IReportService {
  getInactiveCustomers(): Promise<any[]>;
  getGSTReport(): Promise<any>;
}

export class ReportService implements IReportService {
  private readonly API_ENDPOINT = 'reports';

  constructor(private httpClient: HttpClient) {}

  async getInactiveCustomers(): Promise<any[]> {
    try {
      const response = await this.httpClient.get<any>(`${this.API_ENDPOINT}/inactive-customers`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching inactive customers:', error);
      throw error;
    }
  }

  async getGSTReport(): Promise<any> {
    try {
      const response = await this.httpClient.get<any>(`${this.API_ENDPOINT}/gst-export`);
      return response.data;
    } catch (error) {
      console.error('Error fetching GST report:', error);
      throw error;
    }
  }
}
