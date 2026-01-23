import "../styles/form.css";

const ChangePassword = () => {
  return (
    <div className="form-container">
      <div className="form-title">Change Password</div>

      <div className="form-card">
        <div className="form-group">
          <label>Old Password</label>
          <input type="password" />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input type="password" />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" />
        </div>

        <button className="primary-btn">Update Password</button>
      </div>
    </div>
  );
};

export default ChangePassword;
