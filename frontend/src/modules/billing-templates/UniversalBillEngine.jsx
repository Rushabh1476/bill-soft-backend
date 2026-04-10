import React from 'react';

const UniversalBillEngine = ({ bill = {}, saleData = null, size: propSize = null, activeColumns, sizeConfig = null }) => {
  const data = saleData || bill;

  // STRICT RULE: Selected Size = Input Size
  const size = propSize || data?.defaultBillSize || data?.settings?.billSize || 'A4';
  const currentSizeConfig = sizeConfig;

  // --- FALLBACK DATA ---
  const defaultData = {
    businessName: data?.user?.companyName || data?.storeName || "Demo Store",
    businessAddress: data?.user?.address || data?.storeAddress || "City, State",
    businessPhone: data?.user?.phone || data?.storePhone || "+91 00000 00000",
    businessEmail: data?.user?.email || data?.storeEmail || "contact@billsoft.com",
    businessGst: data?.user?.gstNumber || data?.storeGSTIN || "27ABCDE1234F1Z5",
    customerName: data?.customerName || "Walking Customer",
    customerPhone: data?.customerPhone || data?.customer?.phone || "N/A",
    billNumber: data?.billNumber || data?.billNo || `BILL-${Math.floor(Math.random() * 9000) + 1000}`,
    date: data?.createdAt || data?.billDate ? new Date(data.createdAt || data.billDate).toLocaleDateString() : new Date().toLocaleDateString(),
    items: (data?.items && data.items.length > 0) ? data.items.map(i => ({
      productName: i.productName || i.name || "Sample Item",
      quantity: i.quantity || i.qty || 1,
      price: i.price || i.rate || 0,
      total: i.total || ((i.quantity || i.qty || 1) * (i.price || i.rate || 0)),
      hsn: i.hsn || i.customFields?.hsn || "",
      batch: i.batch || i.customFields?.batch || "",
      exp: i.exp || i.customFields?.exp || "",
      taxRate: i.taxRate || i.customFields?.taxRate || 0,
      discount: i.discount || 0
    })) : [{ productName: "Sample Item", quantity: 1, price: 100, total: 100 }],
    subtotal: data?.subtotal || 0,
    taxAmount: data?.taxAmount || 0,
    totalAmount: data?.totalAmount || 0,
    paymentMode: data?.paymentMode || "Cash",
    paymentStatus: data?.paymentStatus || data?.status || "PAID",
    logoUrl: data?.user?.logoUrl || data?.logoUrl || null,
  };

  if (defaultData.totalAmount === 0 && defaultData.items.length > 0) {
    defaultData.totalAmount = defaultData.items.reduce((acc, i) => acc + i.total, 0);
    defaultData.taxAmount = defaultData.items.reduce((acc, i) => acc + (i.total * (i.taxRate / (100 + i.taxRate))), 0);
    defaultData.subtotal = defaultData.totalAmount - defaultData.taxAmount;
  }

  // 🧮 DETAILED TAX BREAKDOWN (FOR WORLD-CLASS FOOTER)
  const taxableValue = defaultData.subtotal || 0;
  const totalTax = defaultData.taxAmount || 0;
  const totalWithTax = taxableValue + totalTax;
  const actualTotal = defaultData.totalAmount || totalWithTax;
  const roundOff = actualTotal - totalWithTax;

  const containerStyle = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#000',
    backgroundColor: '#fff',
    margin: '0 auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  };

  // 🛡️ REFINED COLUMN PRIORITY SYSTEM (ISSUE 1)
  const COLUMN_PRIORITY = ['S.No', 'Item Name', 'Qty', 'Unit', 'Rate', 'Amount', 'Tax', 'Discount', 'HSN', 'Batch', 'Exp'];

  const defaultCols = ['Item Name', 'Qty', 'Amount'];
  const baseCols = activeColumns || defaultCols;

  // Sort columns strictly by priority, then FORCE Amount to the end
  const sortedCols = [...baseCols].sort((a, b) => {
    const pA = COLUMN_PRIORITY.indexOf(a);
    const pB = COLUMN_PRIORITY.indexOf(b);
    return (pA === -1 ? 99 : pA) - (pB === -1 ? 99 : pB);
  });
  const filtered = sortedCols.filter(c => c !== 'Amount');
  const cols = sortedCols.includes('Amount') ? [...filtered, 'Amount'] : filtered;

  // Shared Column Class Resolver for CSS Synchronization
  const getColClass = (col) => {
    switch (col) {
      case 'S.No': return 'col-sn';
      case 'Item Name': return 'col-item-name';
      case 'HSN': return 'col-hsn';
      case 'Unit': return 'col-unit';
      case 'Qty': return 'col-qty';
      case 'Batch': return 'col-batch';
      case 'Exp': return 'col-exp';
      case 'Rate': return 'col-rate';
      case 'Tax': return 'col-tax';
      case 'Discount': return 'col-discount';
      case 'Amount': return 'col-amount';
      default: return '';
    }
  };

  const getColLabel = (col) => {
    // 1. Priority: System Label Overrides (from Manage Columns Modal)
    const customLabel = data?.settings?.columnLabels?.[col] || (data?.customColumns?.find(c => c.id === col)?.label);
    if (customLabel) return customLabel;

    // 2. Default Mappings
    switch (col) {
      case 'S.No': return 'Sr No';
      case 'Item Name': return 'Description of Goods';
      case 'HSN': return 'HSN';
      case 'Qty': return 'Qty';
      case 'Rate': return 'Price';
      case 'Amount': return 'Total';
      case 'Batch': return 'Batch';
      case 'Exp': return 'Exp';
      case 'Unit': return 'Unit';
      case 'Tax': return 'GST%';
      case 'Discount': return 'Disc%';
      default: return col;
    }
  };

  // 🚀 ABSOLUTE SIZE CONTROL (ISSUE 2, 3): SIZE_CONFIG driven layout
  const getColStyles = (col, sizeId, sizeConfig = null) => {
    const isThermal = sizeId.includes('mm') || sizeId.includes('1/7') || sizeId.includes('1/8');

    const configWidths = sizeConfig?.widths || {};
    const width = configWidths[col] || 'auto';

    const baseStyle = {
      width: width,
      boxSizing: 'border-box',
      padding: isThermal ? '4px 6px' : '8px 12px',
      borderBottom: '1px solid #f1f5f9', // Clean row structure
      borderRight: isThermal ? 'none' : '1px solid #e2e8f0',
      textAlign: 'center !important', // 🎯 MANDATORY CENTER ALIGNMENT
      // ✍️ TEXT BEHAVIOR: NO WRAPPING, ELLIPSIS ONLY
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: sizeConfig?.fontSize || '10px',
      lineHeight: 1.2
    };

    return baseStyle;
  };

  // Shared Item Table Renderer
  const renderItemTable = (items, effectiveColumns, sizeId, sizeConfig, colStyles, summaryData = null) => {
    // 🛡️ REQUISITION: Amount column MUST be last
    const baseCols = effectiveColumns || [];
    const filtered = baseCols.filter(c => c !== 'Amount');
    const colsList = baseCols.includes('Amount') ? [...filtered, 'Amount'] : filtered;

    const lastColIdx = colsList.length - 1;

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '2px solid black' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid black' }}>
            {colsList.map((col, idx) => {
              const isCap = data?.settings?.columnCapitalized?.[col] || data?.customColumns?.find(c => c.id === col)?.capitalize;
              return (
                <th key={idx} style={{ ...getColStyles(col, sizeId, sizeConfig), fontWeight: '900', color: '#000', textTransform: isCap ? 'uppercase' : 'capitalize', border: '1px solid black' }}>
                  {getColLabel(col)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              {colsList.map((col, cIdx) => (
                <td key={cIdx} style={{ ...getColStyles(col, sizeId, sizeConfig), border: '1px solid #eee', padding: '8px' }}>
                  {col === 'S.No' ? idx + 1 : 
                   col === 'Item Name' ? item.productName || item.name :
                   col === 'Amount' ? (item.total || 0).toFixed(2) :
                   col === 'Rate' ? (item.price || item.rate || 0).toFixed(2) :
                   col === 'Qty' ? item.quantity || item.qty :
                   item[col] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {summaryData && (
          <tfoot style={{ borderTop: '2px solid black' }}>
            <tr>
              <td colSpan={lastColIdx} style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold', border: '1px solid black' }}>Taxable Value:</td>
              <td style={{ textAlign: 'center', padding: '8px', fontWeight: '900', border: '1px solid black' }}>₹{summaryData.taxableValue?.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={lastColIdx} style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold', border: '1px solid black' }}>GST Component:</td>
              <td style={{ textAlign: 'center', padding: '8px', fontWeight: '900', border: '1px solid black' }}>₹{summaryData.totalTax?.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={lastColIdx} style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold', border: '1px solid black' }}>Round Off:</td>
              <td style={{ textAlign: 'center', padding: '8px', fontWeight: '900', border: '1px solid black' }}>₹{summaryData.roundOff?.toFixed(2)}</td>
            </tr>
            <tr style={{ backgroundColor: '#000', color: '#fff' }}>
              <td colSpan={lastColIdx} style={{ textAlign: 'right', padding: '12px', fontWeight: '950', fontSize: '14px', border: '1px solid black' }}>GRAND TOTAL:</td>
              <td style={{ textAlign: 'center', padding: '12px', fontWeight: '950', fontSize: '18px', border: '1px solid black' }}>₹{summaryData.actualTotal?.toFixed(2)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    );
  };

  // Shared Item Row Renderer for Consistency
  const renderItemRow = (item, idx, sizeId, sizeConfig = null) => {
    const isThermal = sizeId.includes('mm') || sizeId.includes('1/7') || sizeId.includes('1/8');
    return cols.map(c => {
      const s = getColStyles(c, sizeId, sizeConfig);
      let content = '-';
      switch (c) {
        case 'S.No': content = idx + 1; break;
        case 'Item Name': content = <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</div>; break;
        case 'HSN': content = item.hsn || '-'; break;
        case 'Qty': content = item.quantity; break;
        case 'Unit': content = item.unit || item.customFields?.unit || 'NOS'; break;
        case 'Rate': content = isThermal ? (item.price || 0).toFixed(0) : (item.price || 0).toFixed(2); break;
        case 'Amount': content = isThermal ? (item.total || 0).toFixed(0) : (item.total || 0).toFixed(2); break;
        case 'Batch': content = item.batch || '-'; break;
        case 'Exp': content = item.exp || '-'; break;
        case 'Tax': content = `${item.taxRate || 0}%`; break;
        case 'Discount': content = `${item.discount || 0}%`; break;
        default: {
          // 🌉 DYNAMIC RESOLUTION (ISSUE: MISSING DYNAMIC COLS)
          // Tries exact, then lower, then partial match
          const exact = item[c];
          const lower = item[c.toLowerCase()];
          const foundKey = Object.keys(item).find(k => k.toLowerCase() === c.toLowerCase());
          content = exact !== undefined ? exact : (lower !== undefined ? lower : (foundKey ? item[foundKey] : '-'));
        }
      }
      return <td key={c} style={s} className={getColClass(c)}>{content}</td>;
    });
  };

  // 1. 80mm - Thermal
  const render80mm = () => {
    return (
      <div className={`invoice-container thermal-80mm-layout`} style={{ ...containerStyle, fontSize: currentSizeConfig?.fontSize || '9px', width: '80mm', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: '0', fontSize: currentSizeConfig?.titleSize || '11px', fontWeight: 'bold' }}>{defaultData.businessName}</h2>
          <div style={{ fontSize: '8px', opacity: 0.7 }}>{defaultData.date} | #{defaultData.billNumber}</div>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #000' }}>
              {cols.map(c => {
                const isCap = data?.settings?.columnCapitalized?.[c] || data?.customColumns?.find(c => c.id === c)?.capitalize;
                return <th key={c} style={{ ...getColStyles(c, '80mm', currentSizeConfig), textTransform: isCap ? 'uppercase' : 'capitalize' }}>{getColLabel(c)}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {defaultData.items.map((item, idx) => (
              <tr key={idx}>
                {renderItemRow(item, idx, '80mm', currentSizeConfig)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginLeft: 'auto' }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '10px', padding: '2px 0', whiteSpace: 'nowrap' }}>TOTAL</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10px', padding: '2px 0', whiteSpace: 'nowrap' }}>₹{(defaultData.totalAmount || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ textAlign: 'center', fontSize: '8px', opacity: 0.7, paddingTop: '4px', whiteSpace: 'nowrap' }}>Payment: {defaultData.paymentMode}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // 2. 58mm - Small Thermal
  const render58mm = () => {
    return (
      <div className={`invoice-container thermal-58mm-layout`} style={{ ...containerStyle, fontSize: currentSizeConfig?.fontSize || '8.5px', width: '58mm' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontWeight: 'bold', fontSize: currentSizeConfig?.titleSize || '10px' }}>{defaultData.businessName}</div>
          <div style={{ fontSize: '7px', opacity: 0.6 }}>#{defaultData.billNumber}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              {cols.map(c => {
                const isCap = data?.settings?.columnCapitalized?.[c] || data?.customColumns?.find(c => c.id === c)?.capitalize;
                return <th key={c} style={{ ...getColStyles(c, '58mm', currentSizeConfig), textTransform: isCap ? 'uppercase' : 'capitalize' }}>{getColLabel(c)}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {defaultData.items.map((item, idx) => (
              <tr key={idx}>
                {renderItemRow(item, idx, '58mm', currentSizeConfig)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', fontSize: '10px' }}>
          <span>TOT:</span>
          <span>₹{(defaultData.totalAmount || 0).toFixed(0)}</span>
        </div>
      </div>
    );
  };

  // 3. 1/4 Size
  const render1_4Size = () => {
    return (
      <div style={{ ...containerStyle, width: '105mm', minHeight: '148mm', padding: '10mm', fontSize: currentSizeConfig?.fontSize || '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
          <h3 style={{ margin: 0, fontWeight: '950', fontSize: currentSizeConfig?.titleSize || '14px' }}>{defaultData.businessName}</h3>
          <div style={{ fontSize: '9px' }}>#{defaultData.billNumber}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #000' }}>
              {cols.map(c => {
                const isCap = data?.settings?.columnCapitalized?.[c] || data?.customColumns?.find(c => c.id === c)?.capitalize;
                return <th key={c} style={{ ...getColStyles(c, '1/4 Size', currentSizeConfig), textTransform: isCap ? 'uppercase' : 'capitalize' }}>{getColLabel(c)}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {defaultData.items.map((i, idx) => (
              <tr key={idx}>
                {renderItemRow(i, idx, '1/4 Size', currentSizeConfig)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 'auto', textAlign: 'right', fontWeight: '950', fontSize: '13px', borderTop: '2px solid #000', paddingTop: '10px' }}>
          TOTAL: ₹{(defaultData.totalAmount || 0).toFixed(2)}
        </div>
      </div>
    );
  };

  // 4, 5, 6 Size (1/5, 1/6)
  const renderVariableSize = (sizeW, sizeH, sizeId) => {
    const isSmall = sizeId === '1/6 Size';
    return (
      <div style={{ ...containerStyle, width: sizeW, minHeight: sizeH, padding: '5mm', fontSize: isSmall ? '9px' : '10px' }}>
        <div style={{ borderBottom: '2.5px solid #333', paddingBottom: '3px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h3 style={{ margin: 0, fontSize: isSmall ? '12px' : '14px' }}>{defaultData.businessName}</h3>
          <div style={{ fontSize: '8px', textAlign: 'right' }}>{defaultData.date} | #{defaultData.billNumber}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1.5px solid #333' }}>
              {cols.map(c => {
                const isCap = data?.settings?.columnCapitalized?.[c] || data?.customColumns?.find(c => c.id === c)?.capitalize;
                return <th key={c} style={{ ...getColStyles(c, sizeId, currentSizeConfig), textTransform: isCap ? 'uppercase' : 'capitalize' }}>{getColLabel(c)}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {defaultData.items.map((i, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                {renderItemRow(i, idx, sizeId, currentSizeConfig)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginLeft: 'auto', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '4px' }}>
          Total: ₹{(defaultData.totalAmount || 0).toFixed(2)}
        </div>
      </div>
    );
  };

  // 7, 8 (1/7, 1/8)
  const renderCompact = (sizeW, sizeH, sizeId) => {
    return (
      <div style={{ ...containerStyle, width: sizeW, minHeight: sizeH, padding: '4mm', fontSize: '8.5px' }}>
        <div style={{ textAlign: 'center', marginBottom: '5px', borderBottom: '1px solid #000' }}>
          <strong style={{ display: 'block' }}>{defaultData.businessName}</strong>
          <span style={{ fontSize: '7px' }}>INV: #{defaultData.billNumber}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              {cols.map(c => {
                const isCap = data?.settings?.columnCapitalized?.[c] || data?.customColumns?.find(c => c.id === c)?.capitalize;
                return <th key={c} style={{ ...getColStyles(c, sizeId, currentSizeConfig), textTransform: isCap ? 'uppercase' : 'capitalize' }}>{getColLabel(c)}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {defaultData.items.map((i, idx) => (
              <tr key={idx} style={{ borderBottom: '0.5px dotted #ccc' }}>
                {renderItemRow(i, idx, sizeId, currentSizeConfig)}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 'auto', fontWeight: 'bold', fontSize: '11px', textAlign: 'right', borderTop: '1px solid #000', paddingTop: '3px' }}>
          ₹{(defaultData.totalAmount || 0).toFixed(0)}
        </div>
      </div>
    );
  };

  // 9. A4 Standard
  const renderA4 = () => {
    return (
      <div className={`invoice-container a4-standard-layout`} style={{ ...containerStyle, fontSize: currentSizeConfig?.fontSize || '11px', width: '210mm', minHeight: '297mm', padding: '15mm', overflow: 'visible' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #000', paddingBottom: '15px', marginBottom: '25px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: currentSizeConfig?.titleSize || '28px', fontWeight: '950' }}>{defaultData.businessName}</h1>
            <p style={{ opacity: 0.7, maxWidth: '400px', whiteSpace: 'normal', fontSize: '12px' }}>{defaultData.businessAddress}</p>
            <p style={{ fontWeight: 'bold', fontSize: '12px' }}>GSTIN: {defaultData.businessGst}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, color: '#1e40af', fontSize: '32px', fontWeight: '900' }}>TAX INVOICE</h1>
            <p style={{ fontWeight: '900', fontSize: '20px', margin: '5px 0' }}>#{defaultData.billNumber}</p>
            <p style={{ fontSize: '12px' }}>{defaultData.date}</p>
          </div>
        </div>
        {renderItemTable(defaultData.items, cols, 'A4', currentSizeConfig, null, { taxableValue, totalTax, roundOff, actualTotal })}
        <div style={{ marginTop: 'auto', borderTop: '4px solid #000', paddingTop: '25px', width: '100% !important' }}>
          <div style={{ textAlign: 'right', fontSize: '11px', fontStyle: 'italic', opacity: 0.7, marginTop: '12px', color: '#475569' }}>
            Amount in words: RUPEES {defaultData.totalAmountInWords || '...'} ONLY
          </div>
        </div>
      </div>
    );
  };

  // STRICT SIZE DISPATCHER
  const lowerSize = size.toLowerCase().trim();

  if (lowerSize === '1/4 size' || lowerSize === '1/4') return render1_4Size();
  if (lowerSize === '1/5 size' || lowerSize === '1/5') return renderVariableSize('105mm', '118mm', '1/5 Size');
  if (lowerSize === '1/6 size' || lowerSize === '1/6') return renderVariableSize('105mm', '99mm', '1/6 Size');
  if (lowerSize === '1/7 size' || lowerSize === '1/7') return renderCompact('80mm', '110mm', '1/7 Size');
  if (lowerSize === '1/8 size' || lowerSize === '1/8') return renderCompact('74mm', '105mm', '1/8 Size');
  if (lowerSize === '80mm' || lowerSize === '80') return render80mm();
  if (lowerSize === '58mm' || lowerSize === '58') return render58mm();
  if (lowerSize === 'a5') return renderCompact('148mm', '210mm', 'A5');

  return renderA4();
};

export default UniversalBillEngine;
