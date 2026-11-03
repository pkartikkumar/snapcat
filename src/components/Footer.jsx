import React, { useState } from 'react';
import brandLogoDark from '../assets/image/brand_logo_dark.png';
import brandLogoLight from '../assets/image/brand_logo_light.png';
import donateQR from '../assets/image/donateQR.png'; // Import the QR code image

// Place your QR code image in src/assets/image/donateQR.png
// If you don't have one yet, this fallback handles it cleanly
// let upiQrImage;
// try {
//   upiQrImage = new URL('../assets/image/donateQR.png', import.meta.url).href;
// } catch {
//   upiQrImage = null;
// }

export default function Footer({ theme }) {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  const donationDetails = {
    buyMeCoffeeUrl: 'https://buymeacoffee.com',
    cryptoAddress: '0x71C...3984', // Replace with ETH/USDT address
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const currentBrandLogo = theme === 'dark' ? brandLogoDark : brandLogoLight;

  return (
    <>
      <footer className="border-top py-4 mt-auto bg-body">
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-secondary small">
            {/* Brand Logo & Tagline */}
            <div className="d-flex align-items-center gap-2">
              <img
                src={currentBrandLogo}
                alt="SnapCat Logo"
                className="img-fluid"
                style={{ height: '32px' }}
              />
              <span className="fw-semibold text-body">SnapCat</span>
              <span>— Fast, Free & Private Image Suite</span>
            </div>

            {/* Privacy Badges & Donate Button */}
            <div className="d-flex flex-wrap align-items-center gap-3">
              <span>
                <i className="bi bi-shield-check text-success me-1"></i>
                Files never leave your browser
              </span>
              <span>•</span>
              <span>Zero server storage</span>
              <span>•</span>

              <button
                type="button"
                onClick={() => setShowDonateModal(true)}
                className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 fw-semibold"
                style={{ fontSize: '0.8rem' }}
              >
                <i className="bi bi-heart-fill text-danger"></i>
                <span>Donate</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Donate Modal Popup */}
      {showDonateModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1060,
          }}
          onClick={() => setShowDonateModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 bg-body overflow-hidden position-relative">
              {/* Close Button top-right */}
              <button
                type="button"
                className="btn-close position-absolute top-0 end-0 m-3"
                onClick={() => setShowDonateModal(false)}
                aria-label="Close"
                style={{ zIndex: 10 }}
              ></button>

              {/* Centered Brand Logo Header */}
              <div className="text-center pt-4 pb-2 px-4">
                <img
                  src={currentBrandLogo}
                  alt="SnapCat Logo"
                  className="img-fluid mb-2"
                  style={{ height: '54px', objectFit: 'contain' }}
                />
                <h5 className="modal-title fw-bold text-body mb-1">Support SnapCat</h5>
                <p className="text-secondary small mb-0">
                  Fast, 100% free & running right in your browser. If SnapCat helped your workflow, consider scanning to support maintenance!
                </p>
              </div>

              {/* Body */}
              <div className="modal-body px-4 py-3">
                <div className="d-flex flex-column gap-3">
                  {/* Scan to Pay UPI QR Container */}
                  <div className="p-3 rounded-3 border bg-body-tertiary text-center">
                    <span className="small fw-semibold text-body d-block mb-2">
                      <i className="bi bi-qr-code text-primary me-1.5"></i>
                      Scan to Pay via Any UPI App
                    </span>

                    {/* QR Preview Viewport */}
                    <div
                      className="bg-white p-2.5 rounded-3 d-inline-flex align-items-center justify-content-center shadow-sm border mx-auto mb-2"
                      style={{ width: '180px', height: '180px' }}
                    >
                      <img
                        src={donateQR}
                        alt="UPI Scan QR"
                        className="img-fluid rounded"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <small className="text-secondary d-block" style={{ fontSize: '0.75rem' }}>
                      GPay • PhonePe • Paytm • BHIM
                    </small>
                  </div>

                  {/* Option 2: Buy Me a Coffee
                  <a
                    href={donationDetails.buyMeCoffeeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-warning rounded-3 p-2 d-flex align-items-center justify-content-center gap-2 fw-semibold text-dark text-decoration-none shadow-sm"
                  >
                    <i className="bi bi-cup-hot-fill fs-5"></i>
                    <span>Buy Me a Coffee</span>
                  </a> */}

                  {/* Option 3: Crypto (USDT / ETH) */}
                  {/* <div className="p-2.5 rounded-3 border bg-body-tertiary">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-semibold text-body d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-currency-bitcoin text-warning"></i> Crypto (ETH / USDT)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(donationDetails.cryptoAddress, 'crypto')}
                        className="btn btn-sm btn-link p-0 text-decoration-none small text-secondary"
                      >
                        {copiedType === 'crypto' ? (
                          <span className="text-success fw-bold">Copied!</span>
                        ) : (
                          <>
                            <i className="bi bi-clipboard me-1"></i>Copy
                          </>
                        )}
                      </button>
                    </div>
                    <code
                      className="text-body small d-block text-truncate font-monospace"
                      title={donationDetails.cryptoAddress}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {donationDetails.cryptoAddress}
                    </code>
                  </div> */}
                </div>
              </div>

              {/* Footer Note */}
              <div className="modal-footer border-0 pt-0 pb-4 px-4 justify-content-center">
                <span className="text-secondary small">Thank you for supporting private client-side software! ❤️</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}