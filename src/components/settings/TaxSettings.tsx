import React, { useState } from 'react';
import './settings.css';

const TaxSettings: React.FC = () => {
  const [taxSlots, setTaxSlots] = useState<{ name: string; rate: number }[]>([
    { name: '', rate: 0 }
  ]);

  const handleTaxSlotChange = (
    index: number,
    field: 'name' | 'rate',
    value: string | number
  ) => {
    const updatedSlots = [...taxSlots];
    if (field === 'name') {
      updatedSlots[index].name = value as string;
    } else {
      updatedSlots[index].rate = Number(value);
    }
    setTaxSlots(updatedSlots);
  };

  const addTaxSlot = () => {
    setTaxSlots([...taxSlots, { name: '', rate: 0 }]);
  };

  const removeTaxSlot = (index: number) => {
    setTaxSlots(taxSlots.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tax settings submitted:', taxSlots);
  };

  return (
    <div className="settings-form">
      <h2 className="settings-title">Tax Settings</h2>

      <form onSubmit={handleSubmit} className="settings-form-inner">
        {taxSlots.map((slot, index) => (
          <div className="settings-form-row" key={index}>
            <div className="settings-form-group">
              <label>Tax Name</label>
              <input
                type="text"
                placeholder="GST / VAT"
                value={slot.name}
                onChange={(e) =>
                  handleTaxSlotChange(index, 'name', e.target.value)
                }
              />
            </div>

            <div className="settings-form-group small">
              <label>Rate (%)</label>
              <input
                type="number"
                placeholder="0"
                value={slot.rate}
                onChange={(e) =>
                  handleTaxSlotChange(index, 'rate', e.target.value)
                }
              />
            </div>

            <button
              type="button"
              className="settings-remove-btn"
              onClick={() => removeTaxSlot(index)}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="settings-action-row">
          <button
            type="button"
            className="settings-outline-btn"
            onClick={addTaxSlot}
          >
            Add Tax Slot
          </button>

          <button type="submit" className="settings-save-btn">
            Save Tax Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaxSettings;
