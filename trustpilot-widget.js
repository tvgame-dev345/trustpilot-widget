/**
 * <trustpilot-widget> Custom Element
 * Usage: <trustpilot-widget link="https://widget.trustpilot.com/trustbox-data/..."></trustpilot-widget>
 */

class TrustpilotWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const link = this.getAttribute('link');
    if (link) {
      this.fetchAndRender(link);
    } else {
      this.renderError('No link attribute provided.');
    }
  }

  async fetchAndRender(url) {
    this.renderLoading();
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.renderWidget(data);
    } catch (err) {
      // Fallback: use data attribute if provided
      const fallback = this.getAttribute('data-fallback');
      if (fallback) {
        try {
          this.renderWidget(JSON.parse(fallback));
          return;
        } catch (_) {}
      }
      this.renderError('Could not load Trustpilot data.');
    }
  }

  renderLoading() {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="tp-widget tp-loading">
        <div class="tp-spinner"></div>
      </div>
    `;
  }

  renderError(msg) {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="tp-widget tp-error">${msg}</div>
    `;
  }

  renderWidget(data) {
    const bu = data.businessUnit || data.businessEntity || {};
    const links = data.links || {};
    const stars = bu.stars || 0;
    const score = bu.trustScore || 0;
    const total = (bu.numberOfReviews || {}).total || 0;
    const displayName = bu.displayName || '';
    const starsString = data.starsString || this.getStarsLabel(stars);
    const profileUrl = links.profileUrl || '#';
    const evaluateUrl = links.evaluateUrl || '#';

    const filledStars = this.generateStars(stars);

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="tp-widget">
        <div class="tp-header">
          <svg class="tp-logo" viewBox="0 0 126 32" xmlns="http://www.w3.org/2000/svg" aria-label="Trustpilot">
            <path fill="#00b67a" d="M27.56 10.8H17.14L13.78 1 10.42 10.8H0l8.57 6.22L5.21 27.24 13.78 21l8.57 6.24-3.36-10.22z"/>
            <path fill="#005128" d="M19.89 19.45l-.73-2.24-5.38 3.91z"/>
            <text x="32" y="24" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#f5faf6">Trustpilot</text>
          </svg>
        </div>

        <div class="tp-body">
          <div class="tp-score-row">
            <div class="tp-stars-wrap">
              <div class="tp-stars" title="${stars} out of 5 stars">
                ${filledStars}
              </div>
              <span class="tp-stars-label">${starsString}</span>
            </div>
            <div class="tp-score-num">${score.toFixed(1)}</div>
          </div>

          <div class="tp-reviews-row">
            <span class="tp-review-count"><strong>${total.toLocaleString()}</strong> reviews</span>
          </div>

          <div class="tp-business-name">${displayName}</div>

          <div class="tp-actions">
            <a class="tp-btn tp-btn-primary" href="${profileUrl}" target="_blank" rel="noopener">See all reviews</a>
            <a class="tp-btn tp-btn-outline" href="${evaluateUrl}" target="_blank" rel="noopener">Write a review</a>
          </div>
        </div>

        <div class="tp-footer">
          <a href="https://www.trustpilot.com" target="_blank" rel="noopener" class="tp-footer-link">
            Powered by
            <strong>Trustpilot</strong>
          </a>
        </div>
      </div>
    `;
  }

  generateStars(score) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fill = this.getStarFill(score, i);
      const color = this.getStarColor(score);
      stars.push(`
        <svg class="tp-star" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sg${i}${Math.round(score*10)}">
              <stop offset="${fill}" stop-color="${color}"/>
              <stop offset="${fill}" stop-color="#dcdce6"/>
            </linearGradient>
          </defs>
          <path fill="url(#sg${i}${Math.round(score*10)})"
            d="M20 2.5l5.09 10.31 11.37 1.65-8.23 8.02 1.94 11.31L20 28.44l-10.17 5.35 1.94-11.31-8.23-8.02 11.37-1.65z"/>
          <path fill="white" opacity="0.15"
            d="M20 5l4.5 9.1L35 15.65l-7.5 7.3 1.77 10.3L20 28.5l-9.27 4.75 1.77-10.3L5 15.65l10.5-1.55z"/>
        </svg>
      `);
    }
    return stars.join('');
  }

  getStarFill(score, position) {
    const fill = Math.min(1, Math.max(0, score - (position - 1)));
    return `${Math.round(fill * 100)}%`;
  }

  getStarColor(score) {
    if (score >= 4) return '#00b67a';
    if (score >= 3) return '#73cf11';
    if (score >= 2) return '#ffce00';
    if (score >= 1) return '#ff8622';
    return '#ff3722';
  }

  getStarsLabel(score) {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Great';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Poor';
    return 'Bad';
  }

  getStyles() {
    return `
      :host {
        display: inline-block;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }

      .tp-widget {
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        padding: 0;
        width: 300px;
        overflow: hidden;
        transition: box-shadow 0.2s ease;
      }

      .tp-widget:hover {
        box-shadow: 0 4px 24px rgba(0,0,0,0.14);
      }

      .tp-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 160px;
      }

      .tp-spinner {
        width: 32px; height: 32px;
        border: 3px solid #e8e8e8;
        border-top-color: #00b67a;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin { to { transform: rotate(360deg); } }

      .tp-error {
        padding: 20px;
        color: #ff3722;
        font-size: 13px;
        text-align: center;
      }

      /* Header */
      .tp-header {
        background: #191919;
        padding: 14px 18px 10px;
        display: flex;
        align-items: center;
      }

      .tp-logo {
        width: 130px;
        height: 28px;
      }

      /* Body */
      .tp-body {
        padding: 16px 18px 14px;
      }

      .tp-score-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .tp-stars-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .tp-stars {
        display: flex;
        gap: 2px;
      }

      .tp-star {
        width: 28px;
        height: 28px;
      }

      .tp-stars-label {
        font-size: 15px;
        font-weight: 700;
        color: #191919;
        letter-spacing: -0.2px;
      }

      .tp-score-num {
        font-size: 28px;
        font-weight: 800;
        color: #191919;
        line-height: 1;
        letter-spacing: -1px;
      }

      .tp-reviews-row {
        font-size: 13px;
        color: #555;
        margin-bottom: 10px;
      }

      .tp-reviews-row strong {
        color: #191919;
        font-weight: 700;
      }

      .tp-business-name {
        font-size: 13px;
        color: #888;
        margin-bottom: 14px;
        font-weight: 400;
      }

      .tp-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .tp-btn {
        display: inline-block;
        padding: 7px 14px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.15s ease;
        cursor: pointer;
        white-space: nowrap;
      }

      .tp-btn-primary {
        background: #00b67a;
        color: #fff;
        border: 2px solid #00b67a;
      }

      .tp-btn-primary:hover {
        background: #00a069;
        border-color: #00a069;
      }

      .tp-btn-outline {
        background: transparent;
        color: #191919;
        border: 2px solid #191919;
      }

      .tp-btn-outline:hover {
        background: #191919;
        color: #fff;
      }

      /* Footer */
      .tp-footer {
        background: #f5f5f5;
        border-top: 1px solid #e8e8e8;
        padding: 9px 18px;
        text-align: right;
      }

      .tp-footer-link {
        font-size: 11px;
        color: #888;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .tp-footer-link:hover { color: #191919; }

      .tp-footer-link strong {
        color: #191919;
        font-weight: 700;
      }
    `;
  }
}

customElements.define('trustpilot-widget', TrustpilotWidget);
