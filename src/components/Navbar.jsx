import React, { useState, useRef, useEffect } from 'react';
import brandLogoDark from '../assets/image/brand_logo_dark.png';
import brandLogoLight from '../assets/image/brand_logo_light.png';

export default function Navbar({
  theme,
  onToggleTheme,
  onHomeClick,
  activeTab,
  onSelectTab,
  toolCards = [],
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTool = toolCards.find((t) => t.id === activeTab);
  const otherTools = toolCards.filter((t) => t.id !== activeTab);

  return (
    <nav className="navbar navbar-expand-lg border-bottom sticky-top bg-body shadow-sm">
      <div className="container">
        {/* Brand */}
        <div className="d-flex align-items-center gap-3">
          <a
            className="navbar-brand d-flex align-items-center gap-2 fw-bold mb-0"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onHomeClick) onHomeClick();
            }}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={theme === 'dark' ? brandLogoDark : brandLogoLight}
              alt="SnapCat Logo"
              className="img-fluid"
              style={{ height: '34px' }}
            />
            <span className="fs-4 text-body">
              Snap<span style={{ color: 'var(--primary-orange)' }}>Cat</span>
            </span>
          </a>

          {/* ACTIVE TAB & DROPDOWN (shown only when a tool is open) */}
          {activeTab && (
            <div className="d-flex align-items-center gap-1.5 ms-2 ps-3 border-start" ref={dropdownRef}>
              {/* Active Tab Pill */}
              <span className="badge rounded-pill btn-snapcat px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 fs-7">
                <i className={`bi ${activeTool?.icon || 'bi-wrench'}`}></i>
                <span>{activeTool?.title.replace(' IMAGE', '')}</span>
              </span>

              {/* Dropdown Toggle for other tools */}
              <div className="position-relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1.5 d-flex align-items-center gap-1"
                  title="Switch to another tool"
                >
                  <span className="small">More Tools</span>
                  <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} small`}></i>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="dropdown-menu show shadow-lg border rounded-3 py-2 position-absolute mt-2"
                    style={{
                      minWidth: '220px',
                      zIndex: 1050,
                      backgroundColor: 'var(--app-surface)',
                      borderColor: 'var(--app-border)',
                    }}
                  >
                    <div className="px-3 py-1 text-secondary small fw-semibold text-uppercase" style={{ fontSize: '0.68rem' }}>
                      Switch Tool
                    </div>
                    {otherTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(tool.id);
                          setDropdownOpen(false);
                        }}
                        className="dropdown-item d-flex align-items-center gap-2.5 px-3 py-2 small text-body"
                        style={{ cursor: 'pointer' }}
                      >
                        <i className={`bi ${tool.icon}`} style={{ color: tool.iconColor, width: '18px' }}></i>
                        <span>{tool.title}</span>
                      </button>
                    ))}
                    <div className="dropdown-divider my-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        onHomeClick();
                        setDropdownOpen(false);
                      }}
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-1.5 small text-secondary"
                    >
                      <i className="bi bi-grid-fill"></i>
                      <span>All Tools Dashboard</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-none d-sm-flex align-items-center gap-2 badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
            <i className="bi bi-shield-lock-fill"></i>
            <span className="fw-medium">100% In-Browser • 0 Bytes Uploaded</span>
          </div>

          <button
            onClick={onToggleTheme}
            className="btn btn-outline-secondary border-0 rounded-circle d-flex align-items-center justify-content-center p-2"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ width: '40px', height: '40px' }}
          >
            {theme === 'dark' ? (
              <i className="bi bi-sun-fill text-warning fs-5"></i>
            ) : (
              <i className="bi bi-moon-stars-fill text-secondary fs-5"></i>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}