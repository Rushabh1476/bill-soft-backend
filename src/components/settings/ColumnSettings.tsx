import React, { useState } from 'react';
import './settings.css';

const ColumnSettings: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([
    'Product Name',
    'Quantity',
    'Price',
    'Total',
  ]);
  const [customColumn, setCustomColumn] = useState<string>('');

  const handleAddColumn = () => {
    if (customColumn && !columns.includes(customColumn)) {
      setColumns([...columns, customColumn]);
      setCustomColumn('');
    }
  };

  const handleRemoveColumn = (column: string) => {
    setColumns(columns.filter((col) => col !== column));
  };

  return (
    <div className="settings-form">
      <h2 className="settings-title">Column Settings</h2>

      <div className="settings-form-row">
        <div className="settings-form-group">
          <label>Add custom column</label>
          <input
            type="text"
            value={customColumn}
            onChange={(e) => setCustomColumn(e.target.value)}
            placeholder="Discount / HSN Code"
          />
        </div>

        <button
          className="settings-save-btn"
          type="button"
          onClick={handleAddColumn}
        >
          Add Column
        </button>
      </div>

      <ul className="settings-list">
        {columns.map((column, index) => (
          <li key={index} className="settings-list-item">
            <span>{column}</span>
            <button
              className="settings-remove-btn"
              onClick={() => handleRemoveColumn(column)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ColumnSettings;
