import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ConvertTool from './tools/ConvertTool';
import TransparentTool from './tools/TransparentTool';
import PdfTool from './tools/PdfTool';
import EditorTool from './tools/EditorTool';
import CompressTool from './tools/CompressTool';
import ResizeTool from './tools/ResizeTool';
import HtmlToImageTool from './tools/HtmlToImageTool';
import WatermarkTool from './tools/WatermarkTool';
import { TABS } from './constants/toolConfig';

const TOOL_CARDS = [
  {
    id: TABS.COMPRESS,
    title: 'Compress IMAGE',
    desc: 'Compress JPG, PNG, SVG or WebP with best quality and file size down to 5 KB.',
    icon: 'bi-file-earmark-zip-fill',
    badge: 'Popular',
    iconColor: '#0ea5e9',
  },
  {
    id: TABS.RESIZE,
    title: 'Resize IMAGE',
    desc: 'Define new pixel dimensions or scale by percentage in bulk.',
    icon: 'bi-arrows-angle-expand',
    iconColor: '#8b5cf6',
  },
  {
    id: TABS.TRANSPARENT,
    title: 'Transparent PNG',
    desc: 'Remove backgrounds with AI cutout, color keyer, and studio backdrops.',
    icon: 'bi-eraser-fill',
    badge: 'AI Smart',
    iconColor: '#f97316',
  },
  {
    id: TABS.CONVERT,
    title: 'Convert Format',
    desc: 'Convert any image to WebP, PNG, or JPG in bulk with custom quality.',
    icon: 'bi-arrow-repeat',
    iconColor: '#10b981',
  },
  {
    id: TABS.PDF,
    title: 'Images to PDF',
    desc: 'Combine multiple photos into a clean, printable A4 PDF document.',
    icon: 'bi-file-earmark-pdf-fill',
    iconColor: '#ef4444',
  },
  {
    id: TABS.EDITOR,
    title: 'Crop & Edit',
    desc: 'Crop, rotate, and adjust aspect ratios for social media and documents.',
    icon: 'bi-crop',
    iconColor: '#f59e0b',
  },
  {
    id: TABS.HTML_TO_IMAGE,
    title: 'HTML to IMAGE',
    desc: 'Convert any web page URL or raw HTML/CSS into a high-DPI JPG or PNG.',
    icon: 'bi-globe2',
    badge: 'URL & Code',
    iconColor: '#ec4899',
  },
  {
    id: TABS.WATERMARK,
    title: 'Watermark IMAGE',
    desc: 'Stamp an image or text over your photos in seconds. Choose typography, transparency and position.',
    icon: 'bi-shield-shaded',
    iconColor: '#06b6d4',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const switchDropdownRef = useRef(null);

  // Persistent Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('snapcat_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('snapcat_theme', theme);
  }, [theme]);

  // Close workspace dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (switchDropdownRef.current && !switchDropdownRef.current.contains(e.target)) {
        setSwitchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeToolMeta = TOOL_CARDS.find((t) => t.id === activeTab);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header with Active Tab Indicator and Dropdown */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onHomeClick={() => setActiveTab(null)}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          setSwitchOpen(false);
        }}
        toolCards={TOOL_CARDS}
      />

      {/* Main Content */}
      <main className="container my-4 my-md-5 flex-grow-1" style={{ maxWidth: '1050px' }}>
        {/* VIEW 1: HOME CARD DASHBOARD */}
        {activeTab === null ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-5">
              <h1 className="fw-bolder mb-2 text-body display-6">
                Every tool you need to work with images in <span style={{ color: 'var(--primary-orange)' }}>one place</span>
              </h1>
              <p className="text-secondary mx-auto" style={{ maxWidth: '650px' }}>
                Every tool 100% free, private, and running directly in your browser. Zero file uploads, zero server tracking.
              </p>
            </div>

            {/* iLoveIMG Grid Cards */}
            <div className="row g-4">
              {TOOL_CARDS.map((tool) => (
                <div key={tool.id} className="col-12 col-sm-6 col-lg-4">
                  <div
                    onClick={() => setActiveTab(tool.id)}
                    className="card h-100 border-0 bg-body shadow-sm rounded-4 p-4 tool-card position-relative"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid var(--bs-border-color-translucent)',
                    }}
                  >
                    {/* Badge if present */}
                    {tool.badge && (
                      <span
                        className="badge position-absolute top-0 end-0 m-3 px-2.5 py-1 rounded-pill"
                        style={{
                          backgroundColor: 'rgba(249, 115, 22, 0.12)',
                          color: 'var(--primary-orange)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {tool.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div
                      className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: `${tool.iconColor}15`,
                        color: tool.iconColor,
                      }}
                    >
                      <i className={`bi ${tool.icon} fs-3`}></i>
                    </div>

                    {/* Title & Description */}
                    <h5 className="fw-bold mb-2 text-body">{tool.title}</h5>
                    <p className="text-secondary small mb-0 flex-grow-1">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* VIEW 2: ACTIVE TOOL WORKSPACE */
          <div>
            {/* Back button & quick Switcher dropdown */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <button
                onClick={() => {
                  setActiveTab(null);
                  setSwitchOpen(false);
                }}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1.5"
              >
                <i className="bi bi-arrow-left"></i>
                <span>All Tools</span>
              </button>

              {/* Controlled React Dropdown */}
              <div className="position-relative" ref={switchDropdownRef}>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1.5"
                  type="button"
                  onClick={() => setSwitchOpen((prev) => !prev)}
                >
                  <i className={`bi ${activeToolMeta?.icon}`} style={{ color: activeToolMeta?.iconColor }}></i>
                  <span>Switch Tool</span>
                  <i className={`bi bi-chevron-${switchOpen ? 'up' : 'down'} small ms-1`}></i>
                </button>

                {switchOpen && (
                  <ul
                    className="dropdown-menu show shadow border rounded-3 py-2 position-absolute end-0 mt-2"
                    style={{
                      zIndex: 1050,
                      minWidth: '220px',
                      backgroundColor: 'var(--app-surface)',
                      borderColor: 'var(--app-border)',
                    }}
                  >
                    {TOOL_CARDS.map((tool) => (
                      <li key={tool.id}>
                        <button
                          onClick={() => {
                            setActiveTab(tool.id);
                            setSwitchOpen(false);
                          }}
                          className={`dropdown-item d-flex align-items-center gap-2 small px-3 py-2 ${
                            activeTab === tool.id ? 'active btn-snapcat' : 'text-body'
                          }`}
                        >
                          <i
                            className={`bi ${tool.icon}`}
                            style={{ color: activeTab === tool.id ? '#ffffff' : tool.iconColor, width: '18px' }}
                          ></i>
                          <span>{tool.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Active Tool Header */}
            {activeToolMeta && (
              <div className="text-center mb-4">
                <h3 className="fw-bold text-body mb-1">{activeToolMeta.title}</h3>
                <p className="text-secondary small mb-0">{activeToolMeta.desc}</p>
              </div>
            )}

            {/* Tool Viewport */}
            <div className="tab-content">
              {activeTab === TABS.COMPRESS && <CompressTool />}
              {activeTab === TABS.RESIZE && <ResizeTool />}
              {activeTab === TABS.TRANSPARENT && <TransparentTool />}
              {activeTab === TABS.CONVERT && <ConvertTool />}
              {activeTab === TABS.PDF && <PdfTool />}
              {activeTab === TABS.EDITOR && <EditorTool />}
              {activeTab === TABS.HTML_TO_IMAGE && <HtmlToImageTool />}
              {activeTab === TABS.WATERMARK && <WatermarkTool />}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer theme={theme} />
    </div>
  );
}