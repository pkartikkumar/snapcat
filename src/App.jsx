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
    seoTitle: 'Free Image Compressor down to 5 KB & 20 KB',
  },
  {
    id: TABS.RESIZE,
    title: 'Resize IMAGE',
    desc: 'Define new pixel dimensions or scale by percentage in bulk.',
    icon: 'bi-arrows-angle-expand',
    iconColor: '#8b5cf6',
    seoTitle: 'Bulk Image Resizer with Exact Dimensions',
  },
  {
    id: TABS.TRANSPARENT,
    title: 'Transparent PNG',
    desc: 'Remove backgrounds with AI cutout, color keyer, and studio backdrops.',
    icon: 'bi-eraser-fill',
    badge: 'AI Smart',
    iconColor: '#f97316',
    seoTitle: 'In-Browser AI Background Remover & Cutout',
  },
  {
    id: TABS.CONVERT,
    title: 'Convert Format',
    desc: 'Convert any image to WebP, PNG, or JPG in bulk with custom quality.',
    icon: 'bi-arrow-repeat',
    iconColor: '#10b981',
    seoTitle: 'Fast Image Converter (JPG, PNG, WebP, HEIC)',
  },
  {
    id: TABS.PDF,
    title: 'Images to PDF',
    desc: 'Combine multiple photos into a clean, printable A4 PDF document.',
    icon: 'bi-file-earmark-pdf-fill',
    iconColor: '#ef4444',
    seoTitle: 'Convert Photos & Documents to A4 PDF',
  },
  {
    id: TABS.EDITOR,
    title: 'Crop & Edit',
    desc: 'Crop, rotate, and adjust aspect ratios for social media and documents.',
    icon: 'bi-crop',
    iconColor: '#f59e0b',
    seoTitle: 'Free Online Image Cropper & Aspect Ratio Tool',
  },
  {
    id: TABS.HTML_TO_IMAGE,
    title: 'HTML to IMAGE',
    desc: 'Convert any web page URL or raw HTML/CSS into a high-DPI JPG or PNG.',
    icon: 'bi-globe2',
    badge: 'URL & Code',
    iconColor: '#ec4899',
    seoTitle: 'HTML and Webpage Snapshot to High-Res Image',
  },
  {
    id: TABS.WATERMARK,
    title: 'Watermark IMAGE',
    desc: 'Stamp an image or text over your photos in seconds. Choose typography, transparency and position.',
    icon: 'bi-shield-shaded',
    iconColor: '#06b6d4',
    seoTitle: 'Batch Watermark Photos with Text or Logo',
  },
];

export default function App() {
  // Read hash on initial page load (e.g., https://snapcat.in/#compress)
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return Object.values(TABS).includes(hash) ? hash : null;
  });

  const [switchOpen, setSwitchOpen] = useState(false);
  const switchDropdownRef = useRef(null);

  // Persistent Day/Night Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('snapcat_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('snapcat_theme', theme);
  }, [theme]);

  // Synchronize URL hash, Title, and Meta Description on Tab Switch
  useEffect(() => {
    const descTag = document.querySelector('meta[name="description"]');
    if (activeTab) {
      window.history.replaceState(null, '', `#${activeTab}`);
      const meta = TOOL_CARDS.find((t) => t.id === activeTab);
      if (meta) {
        document.title = `${meta.seoTitle || meta.title} — SnapCat`;
        if (descTag) {
          descTag.setAttribute(
            'content',
            `${meta.desc} Process photos 100% locally on your device with zero cloud uploads.`
          );
        }
      }
    } else {
      window.history.replaceState(null, '', window.location.pathname);
      document.title = 'SnapCat — Fast, Free & 100% Private In-Browser Image Suite';
      if (descTag) {
        descTag.setAttribute(
          'content',
          'Convert, compress down to 5 KB, remove backgrounds, crop, and merge images to PDF 100% locally in your browser. Zero uploads, zero tracking.'
        );
      }
    }
  }, [activeTab]);

  // Listen to browser Back/Forward button navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveTab(Object.values(TABS).includes(hash) ? hash : null);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
        onHomeClick={() => {
          setActiveTab(null);
          window.location.hash = '';
        }}
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
              <p className="text-secondary mx-auto" style={{ maxWidth: '680px' }}>
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

            {/* CRAWLABLE SEO / FAQ SECTION */}
            <section className="mt-5 pt-5 border-top">
              <div className="text-center mb-4">
                <h2 className="h4 fw-bold text-body">Why Use SnapCat for Image Editing?</h2>
                <p className="text-secondary small mx-auto" style={{ maxWidth: '600px' }}>
                  A complete suite built for speed, exam document compliance, and total user privacy.
                </p>
              </div>

              <div className="row g-4 text-secondary small">
                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-4 bg-body border h-100 shadow-sm">
                    <h3 className="h6 fw-bold text-body mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-shield-check text-success fs-5"></i> 100% Client-Side Privacy
                    </h3>
                    <p className="mb-0">
                      Standard converters upload your sensitive photos, identity cards, and personal documents to foreign servers. SnapCat runs locally inside your browser via Canvas API and WebAssembly. Your photos never touch any server.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-4 bg-body border h-100 shadow-sm">
                    <h3 className="h6 fw-bold text-body mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark-check text-primary fs-5"></i> Exam & Portal Ready (5 KB – 50 KB)
                    </h3>
                    <p className="mb-0">
                      Government portals (SSC, UPSC, state examinations, visa applications) impose strict size ceilings. SnapCat includes smart micro-presets to compress photos and signatures down to exact targets without blurry pixelation.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-4 bg-body border h-100 shadow-sm">
                    <h3 className="h6 fw-bold text-body mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-lightning-charge-fill text-warning fs-5"></i> Zero Bandwidth Waste
                    </h3>
                    <p className="mb-0">
                      Processing happens instantly on your device hardware. You never waste time or mobile data waiting for massive high-resolution photos to upload and download.
                    </p>
                  </div>
                </div>
              </div>
            </section>
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
                  window.location.hash = '';
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
                <h1 className="h3 fw-bold text-body mb-1">{activeToolMeta.title}</h1>
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