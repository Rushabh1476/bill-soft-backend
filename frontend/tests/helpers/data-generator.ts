import { TestCustomer, TestProduct, TestBill, SECTORS } from './test-helpers';

export class DataGenerator {
  private usedEmails = new Set<string>();
  private usedPhones = new Set<string>();
  private usedSKUs = new Set<string>();

  generateUniqueEmail(base?: string): string {
    let email: string;
    do {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      email = base 
        ? `${base}.${timestamp}.${random}@example.com`
        : `user${timestamp}${random}@example.com`;
    } while (this.usedEmails.has(email));
    
    this.usedEmails.add(email);
    return email;
  }

  generateUniquePhone(): string {
    let phone: string;
    do {
      phone = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    } while (this.usedPhones.has(phone));
    
    this.usedPhones.add(phone);
    return phone;
  }

  generateUniqueSKU(prefix: string = 'SKU'): string {
    let sku: string;
    do {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000);
      sku = `${prefix}-${timestamp}-${random}`;
    } while (this.usedSKUs.has(sku));
    
    this.usedSKUs.add(sku);
    return sku;
  }

  generateGSTNumber(): string {
    const stateCode = (Math.floor(Math.random() * 35) + 1).toString().padStart(2, '0');
    const panNumber = Array(10).fill(0).map(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    const entityCode = '1';
    const checkDigit = 'Z';
    const defaultCode = Math.floor(Math.random() * 10);
    
    return `${stateCode}${panNumber}${entityCode}${checkDigit}${defaultCode}`;
  }

  generateCustomers(count: number, orgName: string): TestCustomer[] {
    const customers: TestCustomer[] = [];
    const firstNames = ['Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Kavita', 'Suresh', 'Neha'];
    const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Gupta', 'Mehta', 'Reddy', 'Iyer', 'Nair', 'Joshi'];
    const streets = ['MG Road', 'Park Street', 'Brigade Road', 'Linking Road', 'Commercial Street', 'Residency Road'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const pincode = Math.floor(Math.random() * 900000) + 100000;

      customers.push({
        name: `${name} (${orgName})`,
        email: this.generateUniqueEmail(`${firstName.toLowerCase()}.${lastName.toLowerCase()}`),
        phone: this.generateUniquePhone(),
        address: `${i + 1}, ${street}, ${city} - ${pincode}`,
        gstNumber: Math.random() > 0.5 ? this.generateGSTNumber() : undefined
      });
    }

    return customers;
  }

  generateProducts(count: number, sector: string, orgName: string): TestProduct[] {
    const products: TestProduct[] = [];
    
    // Sector-specific product templates
    const productTemplates: Record<string, { names: string[], descriptions: string[], priceRange: [number, number] }> = {
      Technology: {
        names: ['Laptop', 'Desktop', 'Server', 'Router', 'Switch', 'Monitor', 'Keyboard', 'Mouse', 'Webcam', 'Headset', 'Printer', 'Scanner', 'External HDD', 'SSD Drive', 'RAM Module'],
        descriptions: ['High-performance computing device', 'Enterprise-grade equipment', 'Professional workstation', 'Business solution', 'Premium quality hardware'],
        priceRange: [5000, 100000]
      },
      Healthcare: {
        names: ['Stethoscope', 'Blood Pressure Monitor', 'Thermometer', 'Pulse Oximeter', 'Surgical Mask', 'Gloves', 'Sanitizer', 'Medical Bed', 'X-Ray Film', 'Syringe', 'Bandage', 'Wheelchair', 'IV Stand', 'Oxygen Cylinder', 'ECG Machine'],
        descriptions: ['Medical-grade equipment', 'Clinical supplies', 'Healthcare essential', 'Diagnostic tool', 'Patient care product'],
        priceRange: [100, 50000]
      },
      Finance: {
        names: ['Financial Software', 'Accounting Tool', 'Tax Calculator', 'Audit Package', 'Investment Platform', 'Trading Terminal', 'Risk Analysis Tool', 'Portfolio Manager', 'Compliance Suite', 'Payment Gateway', 'Billing Software', 'Expense Tracker', 'Budget Planner', 'Invoice Generator', 'Receipt Scanner'],
        descriptions: ['Professional financial solution', 'Business financial tool', 'Enterprise finance software', 'Comprehensive financial suite', 'Advanced financial platform'],
        priceRange: [1000, 200000]
      },
      Retail: {
        names: ['Shopping Cart', 'Display Rack', 'Cash Register', 'Barcode Scanner', 'POS System', 'Inventory Tag', 'Security Camera', 'Mannequin', 'Shopping Bag', 'Price Tag Gun', 'Shelf Label', 'Hangers', 'Packaging Box', 'Receipt Printer', 'Customer Display'],
        descriptions: ['Retail equipment', 'Store essential', 'Retail solution', 'Shop accessory', 'Store furniture'],
        priceRange: [50, 50000]
      },
      Education: {
        names: ['Whiteboard', 'Projector', 'Textbook', 'Notebook', 'Lab Equipment', 'Microscope', 'Globe', 'Atlas', 'Calculator', 'Geometry Set', 'Art Supplies', 'Sports Equipment', 'Library Book', 'Computer Lab Setup', 'Smart Board'],
        descriptions: ['Educational material', 'Learning resource', 'Teaching aid', 'Classroom essential', 'Student supply'],
        priceRange: [100, 80000]
      },
      Manufacturing: {
        names: ['Assembly Tool', 'Welding Machine', 'Drill Press', 'Lathe Machine', 'Milling Machine', 'Cutting Tool', 'Measuring Gauge', 'Safety Gear', 'Conveyor Belt', 'Forklift', 'Pallet Jack', 'Industrial Robot', 'Quality Meter', 'Grinding Machine', 'CNC Machine'],
        descriptions: ['Industrial equipment', 'Manufacturing tool', 'Production machinery', 'Factory essential', 'Industrial solution'],
        priceRange: [1000, 500000]
      },
      'Real Estate': {
        names: ['Property Listing', 'Site Survey', 'Legal Document', 'Valuation Report', 'Construction Material', 'Architect Plan', 'Interior Design', 'Landscaping Service', 'Security System', 'Property Insurance', 'Maintenance Contract', 'Cleaning Service', 'Pest Control', 'Water Proofing', 'Painting Service'],
        descriptions: ['Real estate service', 'Property solution', 'Construction service', 'Property management', 'Real estate essential'],
        priceRange: [1000, 1000000]
      },
      Hospitality: {
        names: ['Hotel Bed', 'Room Service Cart', 'Mini Bar', 'Room Safe', 'Towel Set', 'Bedding Set', 'TV Unit', 'Coffee Maker', 'Room Telephone', 'Hair Dryer', 'Iron Box', 'Luggage Rack', 'Sofa Set', 'Dining Table', 'Kitchen Equipment'],
        descriptions: ['Hotel essential', 'Hospitality product', 'Guest amenity', 'Hotel equipment', 'Room accessory'],
        priceRange: [500, 100000]
      },
      Transportation: {
        names: ['GPS Tracker', 'Fuel Card', 'Vehicle Insurance', 'Maintenance Package', 'Tire Set', 'Engine Oil', 'Battery', 'Brake Pad', 'Air Filter', 'Wiper Blade', 'Car Polish', 'Seat Cover', 'Floor Mat', 'Dashboard Camera', 'Parking Sensor'],
        descriptions: ['Vehicle accessory', 'Auto part', 'Transportation solution', 'Vehicle essential', 'Auto service'],
        priceRange: [200, 50000]
      },
      Entertainment: {
        names: ['Movie Ticket', 'Concert Pass', 'Game Console', 'Gaming Chair', 'VR Headset', 'Sound System', 'Streaming Device', 'DJ Equipment', 'Stage Light', 'Microphone', 'Camera', 'Tripod', 'Video Editor', 'Music Instrument', 'Theater Seat'],
        descriptions: ['Entertainment product', 'Recreation item', 'Leisure equipment', 'Fun accessory', 'Entertainment solution'],
        priceRange: [500, 150000]
      },
      Agriculture: {
        names: ['Tractor', 'Seed', 'Fertilizer', 'Pesticide', 'Irrigation Pump', 'Harvester', 'Plow', 'Sprayer', 'Storage Silo', 'Greenhouse', 'Farming Tool', 'Livestock Feed', 'Water Tank', 'Fencing', 'Greenhouse Cover'],
        descriptions: ['Agricultural equipment', 'Farming supply', 'Agricultural product', 'Farm essential', 'Agricultural solution'],
        priceRange: [100, 500000]
      },
      Energy: {
        names: ['Solar Panel', 'Wind Turbine', 'Battery Storage', 'Inverter', 'Generator', 'Power Cable', 'Transformer', 'Circuit Breaker', 'Energy Meter', 'UPS System', 'Voltage Stabilizer', 'Power Distribution', 'Control Panel', 'Electrical Wire', 'Junction Box'],
        descriptions: ['Energy solution', 'Power equipment', 'Electrical product', 'Energy storage', 'Power generation'],
        priceRange: [1000, 1000000]
      },
      Telecommunications: {
        names: ['Router', 'Modem', 'Network Switch', 'Fiber Cable', 'Antenna', 'Mobile Phone', 'SIM Card', 'Data Plan', 'Telecom Tower', 'Signal Booster', 'Network Card', 'VoIP Phone', 'Conference System', 'Bandwidth Package', 'Cloud Storage'],
        descriptions: ['Telecom equipment', 'Network device', 'Communication tool', 'Connectivity solution', 'Telecom product'],
        priceRange: [200, 200000]
      },
      Consulting: {
        names: ['Business Analysis', 'Strategy Report', 'Market Research', 'Feasibility Study', 'Project Management', 'Risk Assessment', 'Performance Audit', 'Training Program', 'Change Management', 'Process Optimization', 'Compliance Review', 'Quality Assurance', 'Digital Transformation', 'Advisory Service', 'Expert Consultation'],
        descriptions: ['Consulting service', 'Professional advisory', 'Expert analysis', 'Business consultation', 'Strategic planning'],
        priceRange: [5000, 500000]
      },
      'Legal Services': {
        names: ['Legal Consultation', 'Contract Drafting', 'Court Representation', 'Legal Notice', 'Documentation', 'Property Registration', 'Company Registration', 'Trademark Filing', 'Patent Application', 'Legal Opinion', 'Arbitration Service', 'Mediation', 'Litigation Support', 'Compliance Check', 'Legal Audit'],
        descriptions: ['Legal service', 'Law consultation', 'Legal documentation', 'Attorney service', 'Legal solution'],
        priceRange: [2000, 300000]
      }
    };

    const template = productTemplates[sector] || productTemplates.Technology;
    const taxRates = [0, 5, 12, 18, 28]; // Common GST rates in India

    for (let i = 0; i < count; i++) {
      const name = template.names[i % template.names.length];
      const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
      const price = Math.floor(Math.random() * (template.priceRange[1] - template.priceRange[0])) + template.priceRange[0];
      const taxRate = taxRates[Math.floor(Math.random() * taxRates.length)];
      const stock = Math.floor(Math.random() * 500) + 10;

      products.push({
        name: `${name} ${i + 1} (${sector})`,
        description: `${description} - ${orgName}`,
        price: price,
        taxRate: taxRate,
        stock: stock,
        category: sector,
        sku: this.generateUniqueSKU(sector.substring(0, 3).toUpperCase())
      });
    }

    return products;
  }

  generateBills(count: number, customers: string[], products: string[]): TestBill[] {
    const bills: TestBill[] = [];
    const statuses: ('DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED')[] = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE'];
    const notes = [
      'Thank you for your business',
      'Payment due within 30 days',
      'Please make payment to the account mentioned',
      'Contact us for any queries',
      'Urgent payment required',
      'Early payment discount available'
    ];

    for (let i = 0; i < count; i++) {
      const itemCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 items per bill
      const items = [];

      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        items.push({
          productName: product,
          quantity: Math.floor(Math.random() * 10) + 1,
          price: Math.floor(Math.random() * 10000) + 100
        });
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) + 1); // 1 to 60 days from now

      bills.push({
        customerName: customers[Math.floor(Math.random() * customers.length)],
        items: items,
        dueDate: dueDate.toISOString().split('T')[0],
        notes: notes[Math.floor(Math.random() * notes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    return bills;
  }

  generateUserName(): string {
    const firstNames = ['Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Kavita', 'Suresh', 'Neha', 'Arjun', 'Divya', 'Karthik', 'Lakshmi', 'Manoj'];
    const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Gupta', 'Mehta', 'Reddy', 'Iyer', 'Nair', 'Joshi', 'Verma', 'Agarwal', 'Rao', 'Desai', 'Malhotra'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
}
