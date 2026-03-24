import React, { useState, useEffect } from 'react';
import './App.css';

// Icons (inline SVG để không cần thư viện thêm)
const IconSun = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);

const IconMoon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
  </svg>
);

const IconUpload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [resultImage, setResultImage]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [models, setModels]             = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isDark, setIsDark]             = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/models')
      .then(r => r.json())
      .then(data => {
        setModels(data.models);
        if (data.models.length > 0) setSelectedModel(data.models[0]);
      })
      .catch(err => console.error('Lỗi tải model:', err));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setResultImage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert('Vui lòng chọn ảnh!');
    if (!selectedModel) return alert('Vui lòng chọn mô hình!');

    setLoading(true);
    const form = new FormData();
    form.append('file', selectedFile);
    form.append('model_name', selectedModel);

    try {
      const res  = await fetch('http://localhost:8000/detect', { method: 'POST', body: form });
      const data = await res.json();
      await new Promise(r => setTimeout(r, 800));
      setResultImage(data.image_base64);
    } catch (err) {
      console.error('Lỗi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fileName = selectedFile ? selectedFile.name : 'Chưa chọn file';

  return (
    <div className={`app-wrapper ${isDark ? 'dark' : ''}`}>

      {/* ── TOP BAR ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-dot" />
          <span className="brand-name">Pest Vision</span>
        </div>
        <button className="theme-toggle-btn" onClick={() => setIsDark(!isDark)}>
          {isDark ? <IconSun /> : <IconMoon />}
          {isDark ? 'Light' : 'Dark'}
        </button>
      </header>

      {/* ── MAIN ── */}
      <main className="app-container">

        <p className="page-title">
          Ứng dụng nhận diện <span>sâu rầy</span>
        </p>

        {/* Image viewer */}
        <div className="result-container">
          {loading && (
            <div className="loading-overlay">
              <div className="spinner-large" />
              <p>Đang phân tích</p>
            </div>
          )}

          {resultImage && !loading ? (
            <img
              src={`data:image/jpeg;base64,${resultImage}`}
              alt="Kết quả nhận diện"
              className="displayed-image"
            />
          ) : previewUrl && !loading ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="displayed-image preview-mode"
            />
          ) : !loading ? (
            <div className="placeholder-text">
              <span className="placeholder-icon">⬡</span>
              <p>Chưa có ảnh</p>
              <small>Chọn ảnh để bắt đầu phân tích</small>
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="control-panel">

          {/* Model selector */}
          <div className="model-selector">
            <label htmlFor="model-select">Model</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
            >
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* File input */}
          <div className="file-input-wrapper">
            <label className="file-label" htmlFor="file-input">
              <IconUpload />
              Chọn ảnh
            </label>
            <span className="file-name" title={fileName}>{fileName}</span>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Detect */}
          <button
            className="detect-btn"
            onClick={handleUpload}
            disabled={loading || models.length === 0}
          >
            {loading
              ? <><div className="spinner-small" /> Đang xử lý</>
              : 'Nhận diện'}
          </button>

        </div>
      </main>
    </div>
  );
}

export default App;