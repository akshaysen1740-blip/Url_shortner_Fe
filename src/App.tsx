import { useState, useEffect } from "react";
import { 
  Link2, 
  Globe, 
  Copy, 
  Check, 
  QrCode, 
  History, 
  Trash2, 
  AlertCircle, 
  ExternalLink, 
  Sparkles, 
  RefreshCw 
} from "lucide-react";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import { ToastContainer, type ToastMessage } from "./components/Toast";

const API_SHORTEN_URL = import.meta.env.VITE_API_SHORTEN_URL;

interface HistoryItem {
  id: string;
  original: string;
  short: string;
  timestamp: number;
}

function App() {
  // Input URL State
  const [originalUrl, setOriginalUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  
  // API Call States
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [isGlowActive, setIsGlowActive] = useState(false);
  
  // Interactive UI States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Toast notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem("swiftlink_history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // Helper to add toast
  const triggerToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Save history to localStorage whenever it changes
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("swiftlink_history", JSON.stringify(newHistory));
  };

  // URL Validator
  const validateUrl = (value: string) => {
    if (!value) {
      setUrlError("URL is required");
      return false;
    }
    
    // Quick regex validation for generic URLs
    const pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$", // fragment locator
      "i"
    );
    
    if (!pattern.test(value)) {
      setUrlError("Please enter a valid URL (e.g. https://example.com)");
      return false;
    }
    
    setUrlError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(originalUrl)) {
      return;
    }

    setLoading(true);
    setShortUrl("");
    setShowQr(false);
    setIsGlowActive(false);

    // Format URL: prepend http:// if protocol is missing
    let formattedUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "http://" + formattedUrl;
    }

    try {
      const response = await fetch(API_SHORTEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl: formattedUrl }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.success && data.short_url) {
        // Normalise short URL returned from API (ensure protocol prefix is present for visiting)
        let absoluteShortUrl = data.short_url;
        if (!/^https?:\/\//i.test(absoluteShortUrl)) {
          absoluteShortUrl = `http://${absoluteShortUrl}`;
        }

        setShortUrl(absoluteShortUrl);
        setIsGlowActive(true);
        triggerToast("URL Shortened successfully!", "success");
        
        // Confetti Blast
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#8b5cf6", "#06b6d4", "#ec4899"]
        });

        // Add to history
        const newHistoryItem: HistoryItem = {
          id: Date.now().toString(),
          original: formattedUrl,
          short: absoluteShortUrl,
          timestamp: Date.now(),
        };
        saveHistory([newHistoryItem, ...history]);
      } else {
        throw new Error(data?.message || "Failed to shorten URL");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed to connect to API server", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (urlText: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(urlText);
      setCopiedId(itemId);
      triggerToast("Copied to clipboard!", "success");
      
      // Secondary minor confetti splash on copy success!
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#06b6d4", "#8b5cf6"]
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#06b6d4", "#8b5cf6"]
      });

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      triggerToast("Failed to copy link", "error");
    }
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    triggerToast("Item removed from history", "info");
  };

  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your local history?")) {
      saveHistory([]);
      triggerToast("History cleared", "info");
    }
  };

  return (
    <>
      {/* Background decoration */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      <div className="app-container">
        {/* App Header */}
        <header className="app-header">
          <div className="logo-wrapper">
            <Link2 className="logo-icon" size={40} />
            <h1 className="app-title">SwiftLink</h1>
          </div>
          <p className="app-subtitle">
            Url shortner Designed to handle millions of request at onece
          </p>
        </header>

        {/* Shortener Core Card */}
        <main className={`glass-card ${isGlowActive ? "glow-active" : ""}`}>
          {/* Core URL Shortening Form */}
          <form onSubmit={handleSubmit} className="shortener-form">
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="text"
                  className="premium-input"
                  placeholder="Paste your long link here (e.g. google.com)..."
                  value={originalUrl}
                  onChange={(e) => {
                    setOriginalUrl(e.target.value);
                    if (urlError) setUrlError("");
                  }}
                  aria-invalid={!!urlError}
                  aria-describedby={urlError ? "url-error" : undefined}
                />
                <Globe className="input-icon" size={20} />
              </div>
              {urlError && (
                <span id="url-error" className="error-msg">
                  <AlertCircle size={14} />
                  {urlError}
                </span>
              )}
            </div>

            <button type="submit" className="premium-btn" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="spinner" size={20} />
                  <span>Creating Magic Link...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Shorten URL</span>
                </>
              )}
            </button>
          </form>

          {/* Short URL Result Drawer */}
          {shortUrl && (
            <div className="result-container">
              <h2 className="result-title">Shortened URL Generated</h2>
              <div className="result-box-wrapper">
                <div className="result-url-field">{shortUrl}</div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleCopy(shortUrl, "primary_copy")}
                  aria-label="Copy short URL"
                >
                  {copiedId === "primary_copy" ? (
                    <>
                      <Check size={18} style={{ color: "var(--success)" }} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${showQr ? "active" : ""}`}
                  onClick={() => setShowQr(!showQr)}
                  aria-expanded={showQr}
                  aria-label="Toggle QR Code"
                >
                  <QrCode size={18} />
                  <span>QR Code</span>
                </button>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  <ExternalLink size={18} />
                  <span>Visit</span>
                </a>
              </div>

              {/* QR Code Collapsible Drawer */}
              {showQr && (
                <div className="qr-container">
                  <div className="qr-wrapper">
                    <QRCodeSVG
                      value={shortUrl}
                      size={150}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="Q"
                      includeMargin={true}
                    />
                  </div>
                  <span className="qr-caption">Scan this code with a mobile camera to visit the shortened link</span>
                </div>
              )}
            </div>
          )}
        </main>

        {/* History Area */}
        <section className="history-section">
          <div className="history-header">
            <h2 className="history-title">
              <History size={20} style={{ color: "var(--primary)" }} />
              <span>Recent Links</span>
            </h2>
            {history.length > 0 && (
              <button 
                type="button"
                className="clear-history-btn"
                onClick={handleClearAllHistory}
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            )}
          </div>

          <div className="history-card">
            {history.length === 0 ? (
              <div className="history-empty">
                <Link2 size={24} style={{ color: "var(--text-muted)" }} />
                <span>No shortened links yet. Shorten a URL to see it in your list!</span>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-item" key={item.id}>
                    <div className="history-urls">
                      <a
                        href={item.short}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="history-short"
                      >
                        {item.short.replace(/^https?:\/\//i, "")}
                        <ExternalLink size={12} style={{ opacity: 0.6 }} />
                      </a>
                      <span className="history-original" title={item.original}>
                        {item.original}
                      </span>
                    </div>

                    <div className="history-actions">
                      <button
                        type="button"
                        className="action-icon-btn"
                        onClick={() => handleCopy(item.short, item.id)}
                        title="Copy Short Link"
                        aria-label="Copy short link"
                      >
                        {copiedId === item.id ? (
                          <Check size={16} style={{ color: "var(--success)" }} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="action-icon-btn delete-btn"
                        onClick={() => handleDeleteHistory(item.id)}
                        title="Delete from History"
                        aria-label="Delete from history"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="app-footer">
          <span>&copy; {new Date().getFullYear()} SwiftLink URL Shortener. All rights reserved.</span>
          <span>
            Powered by React, Vite, and Redis Caching.
          </span>
        </footer>
      </div>

      {/* Global animated notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default App;
