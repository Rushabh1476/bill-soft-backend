export interface ServiceTicket {
  id: string;
  userId: string;
  ticketNumber: string;
  customerId: string;
  serviceId?: string;
  deviceInfo?: string;
  problemDescription?: string;
  assignedTechnician?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    phone?: string;
  };
  service?: {
    name: string;
    price: number;
  };
  serviceItems: ServiceTicketItem[];
}

export interface ServiceTicketItem {
  id: string;
  serviceTicketId: string;
  itemName: string;
  price: number;
  createdAt: string;
}
