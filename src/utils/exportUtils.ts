import { Bill } from '../types/bill';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export const exportBillHistory = (bills: Bill[]) => {
    const worksheet = XLSX.utils.json_to_sheet(bills);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bill History');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(data, 'bill_history.xlsx');
};

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

export const exportToCSV = (bills: Bill[]) => {
    const csvContent = bills.map(bill => Object.values(bill).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'bill_history.csv');
};