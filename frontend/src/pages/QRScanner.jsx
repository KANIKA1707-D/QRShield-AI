import React, { useState, useEffect, useRef } from 'react';

// Vite exposes env vars prefixed with VITE_
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const QRScanner = () => {
  // Image upload state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  // General loading state (used for any async operation)
  const [loading, setLoading] = useState(false);

  // Scan result from /api/scan (QR image upload)
  const [result, setResult] = useState(null);
  // Analysis result from /api/analyze-url
  const [analysis, setAnalysis] = useState(null);

  // Manual URL paste
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  // Camera‑based scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);

  /** ---------------------------------------------------------------
   *  Camera handling
   *  --------------------------------------------------------------- */
  const startCamera = async () => {
  setCameraError('');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setCameraError('Camera API not available');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      await videoRef.current.play();
    }
    setCameraActive(true);

    // QR detection using BarcodeDetector if available
    if (typeof window.BarcodeDetector === 'function') {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      detectorRef.current = detector;

      const scanLoop = async () => {
        if (!cameraActive) return;
        try {
          const detections = await detector.detect(videoRef.current);
          if (detections && detections.length > 0) {
            const raw = detections[0].rawValue;
            stopCamera();
            if (/^https?:\/\/\S+/i.test(raw)) {
              await handleUrlAnalyze(raw);
            } else {
              setCameraError('Detected QR does not contain a valid URL');
            }
            return;
          }
        } catch (e) {
          console.error('Barcode detection error', e);
        }
        requestAnimationFrame(scanLoop);
      };
      requestAnimationFrame(scanLoop);
    } else {
      // No QR decoder available
      setCameraError('Live QR detection not supported in this browser.');
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    setCameraError('Could not access camera: ' + msg);
  }
};

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /** ---------------------------------------------------------------
   *  Image upload handling
   *  --------------------------------------------------------------- */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setFile(null);
      setPreviewUrl('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setAnalysis(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const scanResponse = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        body: formData,
      });
      const scanData = await scanResponse.json();
      setResult(scanData);
      if (scanData.success && scanData.decoded_url) {
        await handleUrlAnalyze(scanData.decoded_url);
        // Save scan result to history (ignore errors silently)
        try {
          await fetch(`${API_URL}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              decoded_url: scanData.decoded_url,
              risk_score: analysis?.risk_score,
              risk_level: analysis?.risk_level,
              indicators: analysis?.indicators,
              message: analysis?.message,
            }),
          });
        } catch (e) {
          console.error('Failed to save history', e);
        }
      }
    } catch (err) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  /** ---------------------------------------------------------------
   *  URL analysis (manual paste or from QR detection)
   *  --------------------------------------------------------------- */
  const handleUrlAnalyze = async (providedUrl) => {
    const targetUrl = providedUrl || urlInput.trim();
    setUrlError('');
    if (!targetUrl) {
      setUrlError('Please enter a URL');
      return;
    }
    if (!/^https?:\/\/[^\s]+$/i.test(targetUrl)) {
      setUrlError('URL must start with http:// or https://');
      return;
    }
    setLoading(true);
    setResult(null);
    setAnalysis(null);
    try {
      const analysisResponse = await fetch(`${API_URL}/api/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const analysisData = await analysisResponse.json();
      if (!analysisResponse.ok) {
        setAnalysis({ success: false, error: analysisData.error || 'Analysis failed' });
      } else {
        setAnalysis(analysisData);
      }
    } catch (err) {
      setAnalysis({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  /** ---------------------------------------------------------------
   *  Render UI
   *  --------------------------------------------------------------- */
  return (
    <div className="card">
      <h2>QR Scanner</h2>
      <p>Select a QR code image file, paste a URL, or start camera scan to analyze.</p>

      {/* File upload */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
        style={{ marginBottom: '1rem' }}
      />
      {file && (
        <p style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>
          Selected file: <strong>{file.name}</strong>
        </p>
      )}

      {previewUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <img
            src={previewUrl}
            alt="QR preview"
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
          />
        </div>
      )}

      {/* URL paste */}
      <input
        type="text"
        placeholder="Enter URL"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        disabled={loading}
        style={{ width: '100%', marginBottom: '0.5rem' }}
      />
      {urlError && (
        <p style={{ color: 'salmon', marginBottom: '0.5rem' }}>{urlError}</p>
      )}
      <button
        onClick={() => handleUrlAnalyze()}
        disabled={loading || !urlInput.trim()}
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '1rem',
        }}
      >
        {loading ? 'Analyzing…' : 'Analyze URL'}
      </button>

      {/* Camera controls */}
      <div style={{ marginBottom: '1rem' }}>
        {cameraError && (
          <p style={{ color: 'salmon', marginBottom: '0.5rem' }}>{cameraError}</p>
        )}
        {cameraActive ? (
          <button
            onClick={stopCamera}
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginRight: '0.5rem',
            }}
          >
            Stop Camera
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Scan with Camera
          </button>
        )}
        {cameraActive && (
          <div style={{ marginTop: '0.5rem' }}><p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>Camera Preview</p>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', maxHeight: '300px', minHeight: '200px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#000' }}
            />
            {/* Hidden canvas for jsQR fallback */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
      </div>

      {/* QR image scan result */}
      {result && (
        <div style={{ marginTop: '1rem' }}>
          {result.success ? (
            <div>
              <strong>Decoded URL:</strong>
              <p>{result.decoded_url}</p>
            </div>
          ) : (
            <div style={{ color: 'salmon' }}>
              <strong>Error:</strong> {result.error}
            </div>
          )}
        </div>
      )}

      {/* URL analysis result */}
      {analysis && (
        <div style={{ marginTop: '1rem' }}>
          {analysis.success ? (
            <div>
              <p><strong>Risk Score:</strong> {analysis.risk_score}</p>
              <p><strong>Risk Level:</strong> {analysis.risk_level}</p>
              <p><strong>Message:</strong> {analysis.message}</p>
              {analysis.indicators && analysis.indicators.length > 0 && (
                <div>
                  <strong>Indicators:</strong>
                  <ul>
                    {analysis.indicators.map((ind, idx) => (
                      <li key={idx}>{ind}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Playwright investigation details (if present) */}
              {analysis.investigation && (
                <div>
                  <strong>Investigation:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(analysis.investigation, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'salmon' }}>
              <strong>Analysis Error:</strong> {analysis.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;
