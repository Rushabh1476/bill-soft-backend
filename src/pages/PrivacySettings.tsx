import "../styles/form.css";

const PrivacySettings = () => {
  return (
    <div className="form-container">
      <div className="form-title">Privacy Settings</div>

      <div className="form-card">
        <div className="form-group">
          <label>
            <input type="checkbox" /> Show Email
          </label>
        </div>

        <div className="form-group">
          <label>
            <input type="checkbox" /> Show Phone
          </label>
        </div>

        <button className="primary-btn">Save Settings</button>
      </div>
    </div>
  );
};

export default PrivacySettings;
