/**
 * Hardware Service (src/services/PrinterService.js)
 * Class-based service for ESC/POS Thermal and Electron Standard printing.
 */

import { processSaleData } from '../utils/billingUtils';

class PrinterService {
    constructor() {
        this.escpos = null;
        this.usb = null;
        this.isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';
        
        this.initDrivers();
    }

    /**
     * Initializes hardware drivers for Electron environment.
     */
    initDrivers() {
        if (this.isElectron) {
            try {
                // Ensure drivers are available via window.require (Node Integration)
                this.escpos = window.require ? window.require('escpos') : null;
                this.usb = window.require ? window.require('escpos-usb') : null;
            } catch (e) {
                console.warn("Hardware Drivers: escpos or node-escpos-usb not found in renderer.");
            }
        }
    }

    /**
     * Main Dispatcher for printing.
     * @param {Object} rawData - Sale data input
     * @param {string} format - 'Thermal58', 'Thermal80', 'A4Invoice', 'LargeA4'
     * @param {string[]} activeColumns - User selected columns
     */
    async print(rawData, format = 'A4Invoice', activeColumns = []) {
        const data = processSaleData(rawData);

        try {
            if (format.startsWith('Thermal') || format.includes('mm')) {
                return await this.printThermal(data, format, activeColumns);
            } else {
                return await this.printA4(data, format, activeColumns);
            }
        } catch (error) {
            console.error("Printing failure:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ESC/POS Thermal Logic for 58mm/80mm.
     */
    async printThermal(data, format, activeColumns = []) {
        if (!this.escpos || !this.usb) {
            throw new Error("ESC/POS Driver not installed or found in this environment.");
        }

        const is80mm = format.includes('80');
        const width = is80mm ? 42 : 32;
        
        // Dynamic Column Builder
        const defaultCols = ['Item Name', 'Qty', 'Amount'];
        const cols = (activeColumns && activeColumns.length > 0) ? activeColumns : defaultCols;

        return new Promise((resolve, reject) => {
            try {
                const device = new this.usb(); 
                const printer = new this.escpos.Printer(device);

                device.open((err) => {
                    if (err) return reject(err);

                    // 1. Header
                    printer
                        .font('a')
                        .align('ct')
                        .style('b').size(1, 1).text(data.storeName || 'RETAIL POS').size(0, 0).style('normal')
                        .text(data.storeAddress || '')
                        .text(`GST: ${data.storeGSTIN || 'N/A'}`)
                        .feed(1);

                    // 2. Info Block
                    printer
                        .align('lt')
                        .text(`Bill: ${data.billNo}`)
                        .text(`Date: ${data.billDate}`)
                        .text(`Cust: ${data.customerName || 'Standard'}`)
                        .text("-".repeat(width));

                    // 3. Dynamic Table Grid
                    const tableHeader = cols.map(c => {
                        if (c === 'Item Name') return { text: "Item", align: "LEFT", width: 0.4 };
                        if (c === 'Qty') return { text: "Qty", align: "CENTER", width: 0.15 };
                        if (c === 'Amount') return { text: "Amt", align: "RIGHT", width: 0.25 };
                        return { text: c.substring(0, 5), align: "CENTER", width: 0.2 };
                    });
                    
                    printer.tableCustom(tableHeader);

                    data.items.forEach(item => {
                        const row = cols.map(c => {
                            if (c === 'Item Name') return { text: String(item.name).substring(0, 15), align: "LEFT", width: 0.4 };
                            if (c === 'Qty') return { text: String(item.qty), align: "CENTER", width: 0.15 };
                            if (c === 'Amount') return { text: (item.total).toFixed(0), align: "RIGHT", width: 0.25 };
                            
                            // Map other custom fields
                            let val = '-';
                            if (c === 'HSN') val = item.hsn || '-';
                            else if (c === 'Batch') val = item.batch || '-';
                            else if (c === 'Exp') val = item.exp || '-';
                            else if (c === 'Tax') val = `${item.taxRate}%`;
                            else if (c === 'Rate') val = item.rate.toFixed(0);
                            
                            return { text: String(val).substring(0, 10), align: "CENTER", width: 0.2 };
                        });
                        printer.tableCustom(row);
                    });

                    printer.text("-".repeat(width));

                    // 4. TCS/GST Row
                    printer
                        .align('rt')
                        .text(`Taxable: ${data.summary.basicTotal.toFixed(2)}`)
                        .text(`Total Tax: ${data.summary.taxTotal.toFixed(2)}`);
                    
                    if (data.summary.tcsAmount > 0) {
                        printer.text(`TCS Amount: ${data.summary.tcsAmount.toFixed(2)}`);
                    }

                    // 5. Total and Footer
                    printer
                        .style('b')
                        .size(1, 1)
                        .text(`GRAND TOTAL: ₹${data.summary.grandTotal}`)
                        .size(0, 0)
                        .style('normal')
                        .feed(1)
                        .align('ct')
                        .text("THANK YOU - VISIT AGAIN")
                        .feed(1)
                        .cut() // Hardware Cut Paper
                        .close(() => {
                            resolve({ success: true, type: 'Thermal' });
                        });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Electron Standard Printing (A4/Legal).
     */
    async printA4(data, format) {
        if (!this.isElectron) {
            window.print();
            return { success: true, type: 'System print' };
        }

        const { ipcRenderer } = window.require('electron');

        // Logic: Dispatches high-fidelity React template to hidden worker window in Main Process
        return new Promise((resolve) => {
            // silent: true as per requirement
            ipcRenderer.send('electron-print-command', {
                data,
                format,
                options: { silent: true, margins: { marginType: 'none' } }
            });

            ipcRenderer.once('electron-print-reply', (event, status) => {
                resolve(status || { success: true });
            });
        });
    }
}

// Singleton Instance
export default new PrinterService();
