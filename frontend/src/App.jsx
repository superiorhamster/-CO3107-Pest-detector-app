import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  
  // State quản lý Theme
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Lấy danh sách mô hình từ Backend
  useEffect(() => {
    fetch("http://localhost:8000/models")
      .then(res => res.json())
      .then(data => {
        setModels(data.models);
        if (data.models.length > 0) setSelectedModel(data.models[0]);
      })
      .catch(err => console.error("Lỗi tải danh sách model:", err));
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setResultImage(null); 
    setPreviewUrl(null); 
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); 
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Vui lòng chọn ảnh!");
    if (!selectedModel) return alert("Vui lòng chọn mô hình dự đoán!");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("model_name", selectedModel);

    try {
      const response = await fetch("http://localhost:8000/detect", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      await new Promise(resolve => setTimeout(resolve, 800));
      setResultImage(data.image_base64);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
      
      <button className="theme-toggle-btn" onClick={toggleTheme}>
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      <div className="app-container">
        <h1>Ứng Dụng Nhận Diện Sâu Rầy</h1>

        <div className="result-container">
          {loading && (
            <div className="loading-overlay">
              <div className="spinner-large"></div>
              <p>Đang xử lý...</p>
            </div>
          )}
          
          {resultImage && !loading ? (
            <img src={`data:image/jpeg;base64,${resultImage}`} alt="Kết quả" className="displayed-image" />
          ) : previewUrl && !loading ? (
            <img src={previewUrl} alt="Preview" className="displayed-image preview-mode" />
          ) : null}
        </div>
        
        <div className="control-panel">
          <div className="model-selector">
            <label>Mô hình: </label>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <input type="file" accept="image/*" onChange={handleFileChange} />
          
          <button onClick={handleUpload} disabled={loading || models.length === 0} className="detect-btn">
            {loading ? <div className="spinner-small"></div> : "Nhận diện"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;