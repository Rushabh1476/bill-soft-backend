/**
 * Compliance Utility (src/utils/billingUtils.js)
 * 100% Pure Functions for POS compliance.
 */
import { toWords } from './currency';

/**
 * Split tax into component parts based on state.
 * @param {number} taxableValue 
 * @param {number} taxRate 
 * @param {boolean} isInterState 
 * @returns {Object} { cgst, sgst, igst, totalTax }
 */
export const calculateGST = (taxableValue, taxRate, isInterState = false) => {
    const totalTax = Number(((taxableValue * taxRate) / 100).toFixed(2));
    
    if (isInterState) {
        return {
            cgst: 0,
            sgst: 0,
            igst: totalTax,
            totalTax
        };
    } else {
        const half = Number((totalTax / 2).toFixed(2));
        return {
            cgst: half,
            sgst: half,
            igst: 0,
            totalTax
        };
    }
};

/**
 * TCS Calculator supporting Basic or Total mode.
 * @param {number} basicValue - Value before GST
 * @param {number} totalValue - Value after GST
 * @param {number} tcsRate - Percentage
 * @param {boolean} calculateOnBasic - Toggle mode
 */
export const calculateTCS = (basicValue, totalValue, tcsRate = 0, calculateOnBasic = false) => {
    if (tcsRate <= 0) return 0;
    const targetValue = calculateOnBasic ? basicValue : totalValue;
    return Number(((targetValue * tcsRate) / 100).toFixed(2));
};

/**
 * Indian Currency Round-off logic (Math.round).
 * @param {number} amount 
 * @returns {Object} { roundedAmount, roundOffDiff }
 */
export const applyIndianRounding = (amount) => {
    const rounded = Math.round(amount);
    const diff = Number((rounded - amount).toFixed(2));
    return {
        roundedAmount: rounded,
        roundOffDiff: diff
    };
};

/**
 * Processes full sale block into compliant structure.
 */
export const processSaleData = (saleData) => {
    const { 
        items, 
        isInterState = false, 
        tcsRate = 0, 
        tcsMode = 'TOTAL' // 'BASIC' or 'TOTAL'
    } = saleData;

    let basicTotal = 0;
    let cgstGrandTotal = 0;
    let sgstGrandTotal = 0;
    let igstGrandTotal = 0;

    const enrichedItems = items.map(item => {
        // --- DATA NORMALIZATION (ISSUE: INCONSISTENT COLUMN VISIBILITY) ---
        // Map quantity/qty, price/rate, and flatten customFields
        const qty = Number(item.qty || item.quantity || 1);
        const rate = Number(item.rate || item.price || 0);
        const cFields = item.customFields || {};
        
        // Extract flat fields for template compatibility
        const hsn = item.hsn || cFields.hsn || '';
        const batch = item.batch || cFields.batch || '';
        const exp = item.exp || cFields.exp || '';
        const mfg = item.mfg || cFields.mfg || '';
        const unit = item.unit || cFields.unit || 'PCS';
        const size = item.size || cFields.size || '';
        const discount = Number(item.discount || cFields.discount || 0);
        const taxRate = Number(item.taxRate || 0);

        const itemBasic = (rate * qty) - ((rate * qty * discount) / 100);
        const { cgst, sgst, igst, totalTax } = calculateGST(itemBasic, taxRate, isInterState);
        
        basicTotal += itemBasic;
        cgstGrandTotal += cgst;
        sgstGrandTotal += sgst;
        igstGrandTotal += igst;

        return {
            ...item,
            ...cFields, // 🚀 FLATTEN EVERYTHING (ISSUE: MISSING DYNAMIC COLS)
            qty,
            rate,
            hsn,
            batch,
            exp,
            mfg,
            unit,
            size,
            discount,
            taxRate,
            taxableAmount: Number(itemBasic.toFixed(2)),
            cgst,
            sgst,
            igst,
            totalTax,
            total: itemBasic + totalTax
        };
    });

    const taxGrandTotal = cgstGrandTotal + sgstGrandTotal + igstGrandTotal;
    const valueBeforeTCS = basicTotal + taxGrandTotal;
    
    const tcsAmount = calculateTCS(
        basicTotal, 
        valueBeforeTCS, 
        tcsRate, 
        tcsMode === 'BASIC'
    );

    const finalValue = valueBeforeTCS + tcsAmount;
    const { roundedAmount, roundOffDiff } = applyIndianRounding(finalValue);

    return {
        ...saleData,
        items: enrichedItems,
        summary: {
            basicTotal: Number(basicTotal.toFixed(2)),
            cgstTotal: Number(cgstGrandTotal.toFixed(2)),
            sgstTotal: Number(sgstGrandTotal.toFixed(2)),
            igstTotal: Number(igstGrandTotal.toFixed(2)),
            taxTotal: Number(taxGrandTotal.toFixed(2)),
            tcsAmount: Number(tcsAmount.toFixed(2)),
            beforeRounding: Number(finalValue.toFixed(2)),
            grandTotal: roundedAmount,
            roundOff: roundOffDiff,
            grandTotalInWords: toWords(roundedAmount),
            taxTotalInWords: toWords(taxGrandTotal)
        }
    };
};
