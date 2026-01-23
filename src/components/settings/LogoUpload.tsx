import React, { useState } from 'react';

const LogoUpload: React.FC = () => {
    const [logo, setLogo] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = () => {
        if (logo) {
            // Logic to upload the logo to the server
            console.log('Uploading logo:', logo);
        }
    };

    return (
        <div>
            <h2>Upload Custom Logo</h2>
            <div>
                <label htmlFor="logoUpload">Choose Logo File:</label>
                <input 
                    id="logoUpload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    aria-describedby="logoHelp"
                />
                <small id="logoHelp">Select an image file (PNG, JPG, GIF) for your company logo</small>
            </div>
            {preview && (
                <div>
                    <p>Logo Preview:</p>
                    <img 
                        src={preview} 
                        alt="Logo Preview" 
                        className="logo-preview"
                    />
                </div>
            )}
            <button onClick={handleUpload} disabled={!logo}>Upload Logo</button>
        </div>
    );
};

export default LogoUpload;