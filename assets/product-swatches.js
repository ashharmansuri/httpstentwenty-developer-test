/**
 * <product-swatches>
 *
 * Lives inside a .collection-product card. All variant data (image, price, url)
 * is pre-rendered by Liquid into data-* attributes on each swatch button, so a
 * click needs zero network requests and zero JSON parsing: just DOM updates.
 *
 * - One delegated listener per card (not per swatch).
 * - Works automatically after AJAX filter re-renders, because
 *   connectedCallback runs again for the new elements.
 * - Hover / keyboard focus preloads the swatch image so the swap feels instant.
 */
class ProductSwatches extends HTMLElement {
    connectedCallback() {
        this.card = this.closest('.collection-product');
        if (!this.card) return;

        this.image = this.card.querySelector('[data-card-image]');
        this.link = this.card.querySelector('[data-card-link]');
        this.price = this.card.querySelector('[data-card-price]');
        this.selected = this.querySelector('.product-swatch[aria-pressed="true"]');
        this.preloaded = new Set();

        this.addEventListener('click', this);
        this.addEventListener('pointerover', this);
        this.addEventListener('focusin', this);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this);
        this.removeEventListener('pointerover', this);
        this.removeEventListener('focusin', this);
    }

    handleEvent(event) {
        const swatch = event.target.closest('.product-swatch');
        if (!swatch || !this.contains(swatch)) return;

        if (event.type === 'click') this.select(swatch);
        else this.preload(swatch);
    }

    select(swatch) {
        if (swatch === this.selected) return;

        const { url, price, image, imageAlt } = swatch.dataset;

        this.selected?.setAttribute('aria-pressed', 'false');
        swatch.setAttribute('aria-pressed', 'true');
        this.selected = swatch;

        if (this.image && image) {
            this.image.src = image;
            this.image.alt = imageAlt || '';
        }
        if (this.price && price) this.price.textContent = price;
        if (this.link && url) this.link.href = url;
    }

    preload(swatch) {
        const src = swatch.dataset.image;
        if (!src || this.preloaded.has(src)) return;

        this.preloaded.add(src);
        new Image().src = src;
    }
}

if (!customElements.get('product-swatches')) {
    customElements.define('product-swatches', ProductSwatches);
}