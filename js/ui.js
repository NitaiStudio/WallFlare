/**
 * UI Management Module
 * Handles all UI rendering, animations, and interactions
 */

class UIManager {
    constructor() {
        this.wallpaperGrid = document.getElementById('wallpaperGrid');
        this.modal = document.getElementById('fullscreenModal');
        this.modalImage = document.getElementById('modalImage');
        this.modalResolution = document.getElementById('modalResolution');
        this.splashScreen = document.getElementById('splashScreen');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.noResults = document.getElementById('noResults');
        this.currentModalWallpaper = null;
    }

    /**
     * Show splash screen
     */
    showSplash() {
        this.splashScreen.style.display = 'flex';
    }

    /**
     * Hide splash screen with animation
     */
    hideSplash() {
        return new Promise(resolve => {
            this.splashScreen.classList.add('exit');
            setTimeout(() => {
                this.splashScreen.style.display = 'none';
                resolve();
            }, 800);
        });
    }

    /**
     * Show skeleton loaders
     */
    showSkeletons(count = 8) {
        this.wallpaperGrid.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card';
            skeleton.innerHTML = '<div class="skeleton-shimmer"></div>';
            skeleton.style.animationDelay = `${i * 0.05}s`;
            this.wallpaperGrid.appendChild(skeleton);
        }
    }

    /**
     * Render wallpaper cards with staggered animation
     */
    renderWallpapers(wallpapers, clearExisting = true) {
        if (clearExisting) {
            this.wallpaperGrid.innerHTML = '';
        }

        if (wallpapers.length === 0 && clearExisting) {
            this.noResults.style.display = 'block';
            return;
        }

        this.noResults.style.display = 'none';

        wallpapers.forEach((wallpaper, index) => {
            const card = this.createWallpaperCard(wallpaper, index);
            this.wallpaperGrid.appendChild(card);
        });
    }

    /**
     * Create a single wallpaper card
     */
    createWallpaperCard(wallpaper, index) {
        const card = document.createElement('div');
        card.className = 'wallpaper-card';
        card.style.animationDelay = `${index * 0.06}s`;
        card.dataset.id = wallpaper.id;

        card.innerHTML = `
            <img src="${wallpaper.thumbnailUrl}" 
                 alt="${wallpaper.title}" 
                 loading="lazy"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22500%22><rect fill=%22%23333%22 width=%22300%22 height=%22500%22/><text fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22>No Image</text></svg>'">
            <div class="card-overlay">
                <span class="resolution-badge">${wallpaper.resolution}</span>
                <div style="display:flex;gap:8px;">
                    <button class="download-btn" data-action="download" title="Download">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <button class="favorite-btn ${this.isFavorite(wallpaper.id) ? 'active' : ''}" 
                            data-action="favorite" 
                            title="Favorite">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${this.isFavorite(wallpaper.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        card.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest('[data-action="download"]')) {
                e.stopPropagation();
                this.handleDownload(wallpaper);
            } else if (target.closest('[data-action="favorite"]')) {
                e.stopPropagation();
                this.handleFavoriteToggle(wallpaper, card);
            } else {
                this.openFullscreen(wallpaper);
            }
        });

        return card;
    }

    /**
     * Open fullscreen preview
     */
    openFullscreen(wallpaper) {
        this.currentModalWallpaper = wallpaper;
        this.modalImage.src = wallpaper.imageUrl;
        this.modalResolution.textContent = wallpaper.resolution;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Update favorite button state
        const favBtn = document.getElementById('modalFavorite');
        if (this.isFavorite(wallpaper.id)) {
            favBtn.querySelector('svg').setAttribute('fill', 'currentColor');
        } else {
            favBtn.querySelector('svg').setAttribute('fill', 'none');
        }
    }

    /**
     * Close fullscreen preview
     */
    closeFullscreen() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentModalWallpaper = null;
    }

    /**
     * Handle download
     */
    async handleDownload(wallpaper) {
        try {
            const response = await fetch(wallpaper.imageUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wallflare-${wallpaper.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Save to download history
            this.saveToHistory(wallpaper);
            
            // Show toast
            showToast('Wallpaper downloaded!');
        } catch (error) {
            console.error('Download failed:', error);
            showToast('Download failed. Try again.');
        }
    }

    /**
     * Save download to history
     */
    saveToHistory(wallpaper) {
        let history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        history.unshift({
            id: wallpaper.id,
            title: wallpaper.title,
            imageUrl: wallpaper.imageUrl,
            thumbnailUrl: wallpaper.thumbnailUrl,
            timestamp: new Date().toISOString()
        });
        // Keep only last 50
        history = history.slice(0, 50);
        localStorage.setItem('downloadHistory', JSON.stringify(history));
    }

    /**
     * Handle favorite toggle
     */
    handleFavoriteToggle(wallpaper, card) {
        const favorites = this.getFavorites();
        const index = favorites.findIndex(f => f.id === wallpaper.id);
        
        if (index > -1) {
            favorites.splice(index, 1);
            showToast('Removed from favorites');
        } else {
            favorites.push(wallpaper);
            showToast('Added to favorites');
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // Update UI
        if (card) {
            const favBtn = card.querySelector('[data-action="favorite"]');
            if (favBtn) {
                favBtn.classList.toggle('active', index === -1);
                const svg = favBtn.querySelector('svg');
                if (svg) {
                    svg.setAttribute('fill', index === -1 ? 'currentColor' : 'none');
                }
            }
        }
    }

    /**
     * Check if wallpaper is favorite
     */
    isFavorite(id) {
        const favorites = this.getFavorites();
        return favorites.some(f => f.id === id);
    }

    /**
     * Get favorites from localStorage
     */
    getFavorites() {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.loadingIndicator.style.display = 'flex';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    /**
     * Show toast message
     */
    showToastFn(message, duration = 2000) {
        showToast(message, duration);
    }

    /**
     * Render favorites page
     */
    renderFavorites() {
        const favorites = this.getFavorites();
        this.wallpaperGrid.innerHTML = '';
        
        if (favorites.length === 0) {
            this.noResults.innerHTML = `
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <p>No favorites yet</p>
                <p style="font-size:0.8rem;">Tap the heart icon to save wallpapers</p>
            `;
            this.noResults.style.display = 'block';
            return;
        }
        
        this.noResults.style.display = 'none';
        this.renderWallpapers(favorites);
    }

    /**
     * Render download history
     */
    renderHistory() {
        const historyContent = document.getElementById('historyContent');
        const history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        
        if (history.length === 0) {
            historyContent.innerHTML = '<p class="empty-state">No downloads yet</p>';
            return;
        }

        historyContent.innerHTML = history.map((item, index) => `
            <div class="history-item" style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border);">
                <img src="${item.thumbnailUrl}" alt="${item.title}" 
                     style="width:50px;height:50px;border-radius:8px;object-fit:cover;"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22><rect fill=%22%23333%22 width=%2250%22 height=%2250%22/></svg>'">
                <div style="flex:1;min-width:0;">
                    <p style="font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</p>
                    <p style="font-size:0.7rem;color:var(--text-secondary);">
                        ${new Date(item.timestamp).toLocaleString()}
                    </p>
                </div>
                <button onclick="downloadFromHistory('${item.imageUrl}', '${item.id}')" 
                        style="background:var(--primary);color:white;border:none;padding:6px 12px;border-radius:12px;font-size:0.75rem;cursor:pointer;">
                    Download
                </button>
            </div>
        `).join('');
    }
}

// Global UI instance
const uiManager = new UIManager();

// Global toast function
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Global download from history function
function downloadFromHistory(imageUrl, id) {
    fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wallflare-${id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Download started!');
        })
        .catch(() => showToast('Download failed'));
}