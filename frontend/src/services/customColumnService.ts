import { api } from './api';

export interface CustomColumn {
  id: string;
  name: string;
  label: string;
  type: string;
  entity: string;
  required: boolean;
  isActive: boolean;
}

export class CustomColumnService {
  private static endpoint = '/custom-columns';

  static async getColumns(): Promise<CustomColumn[]> {
    const response = await api.get(this.endpoint);
    return response.data.columns;
  }

  static async getColumnsByEntity(entity: string): Promise<CustomColumn[]> {
    const columns = await this.getColumns();
    return columns.filter(c => c.entity === entity);
  }

  static async createColumn(data: Partial<CustomColumn>): Promise<CustomColumn> {
    const response = await api.post(this.endpoint, data);
    return response.data.column;
  }

  static async updateColumn(id: string, data: Partial<CustomColumn>): Promise<void> {
    await api.put(`${this.endpoint}/${id}`, data);
  }

  static async deleteColumn(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/${id}`);
  }
}
