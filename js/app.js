/**
 * Main Application Module
 * Coordinates all app functionality
 */

class App {
    constructor() {
        this.currentPage = 'home';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.init();
    }

    async init() {
        // Show splash screen
        uiManager.showSplash();

        // Load initial data
        await this.loadInitialData();

        // Hide splash after minimum display time
        setTimeout(async () => {
            await uiManager.hideSplash();
        }, 1500);

        // Setup event listeners
        this.setupNavigation();
        this.setupSearch();
        this.setupCategoryChips();
        this.setupModal();
        this.setupInfiniteScroll();
        this.setupSettings();
        this.setupPWA();
    }

    async loadInitialData() {
        uiManager.showSkeletons();
        const result = await bloggerAPI.fetchWallpapers();
        
        if (result.error) {
            // If API fails, load demo data
            this.loadDemoData();
        } else {
            uiManager.renderWallpapers(result.wallpapers);
        }
    }

    loadDemoData() {
        // Demo wallpapers for testing when API is not configured
        const demoWallpapers = [
            {
                id: 'demo1',
                title: 'Mountain Sunset',
                imageUrl: 'https://picsum.photos/seed/mountain/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/mountain/400/711',
                labels: ['nature'],
                resolution: '4K'
            },
            {
                id: 'demo2',
                title: 'Abstract Waves',
                imageUrl: 'https://picsum.photos/seed/abstract/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/abstract/400/711',
                labels: ['abstract'],
                resolution: '4K'
            },
            {
                id: 'demo3',
                title: 'City at Night',
                imageUrl: 'https://picsum.photos/seed/city/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/city/400/711',
                labels: ['dark'],
                resolution: 'HD'
            },
            {
                id: 'demo4',
                title: 'Space Nebula',
                imageUrl: 'https://picsum.photos/seed/space/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/space/400/711',
                labels: ['space'],
                resolution: '4K'
            },
            {
                id: 'demo5',
                title: 'Minimal Art',
                imageUrl: 'https://picsum.photos/seed/minimal/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/minimal/400/711',
                labels: ['minimal'],
                resolution: '4K'
            },
            {
                id: 'demo6',
                title: 'Forest Path',
                imageUrl: 'https://picsum.photos/seed/forest/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/forest/400/711',
                labels: ['nature'],
                resolution: '4K'
            },
            {
                id: 'demo7',
                title: 'Neon Lights',
                imageUrl: 'https://picsum.photos/seed/neon/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/neon/400/711',
                labels: ['dark'],
                resolution: 'HD'
            },
            {
                id: 'demo8',
                title: 'Ocean Waves',
                imageUrl: 'https://picsum.photos/seed/ocean/800/1422',
                thumbnailUrl: 'https://picsum.photos/seed/ocean/400/711',
                labels: ['nature'],
                resolution: '4K'
            }
        ];

        uiManager.renderWallpapers(demoWallpapers);
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Update active state
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        this.currentPage = page;
        
        // Hide panels
        document.getElementById('settingsPanel').classList.remove('active');
        document.getElementById('historyPanel').classList.remove('active');
        
        switch(page) {
            case 'home':
                this.loadInitialData();
                break;
            case 'categories':
                // Show categories view
                this.showCategoriesView();
                break;
            case 'favorites':
                uiManager.renderFavorites();
                break;
            case 'settings':
                document.getElementById('settingsPanel').classList.add('active');
                break;
        }
    }

    showCategoriesView() {
        // For categories page, show categorized wallpapers
        uiManager.showSkeletons(12);
        bloggerAPI.fetchWallpapers().then(result => {
            uiManager.renderWallpapers(result.wallpapers);
        });
    }

    setupSearch() {
        const searchToggle = document.getElementById('searchToggle');
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');
        const searchClose = document.getElementById('searchClose');
        
        searchToggle.addEventListener('click', () => {
            searchContainer.style.display = 'block';
            searchInput.focus();
        });
        
        searchClose.addEventListener('click', () => {
            searchContainer.style.display = 'none';
            searchInput.value = '';
            this.searchQuery = '';
            this.loadInitialData();
        });
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                this.searchQuery = e.target.value.trim();
                if (this.searchQuery) {
                    uiManager.showSkeletons(4);
                    const result = await bloggerAPI.searchWallpapers(this.searchQuery);
                    uiManager.renderWallpapers(result.wallpapers);
                } else {
                    this.loadInitialData();
                }
            }, 500);
        });
    }

    setupCategoryChips() {
        const chips = document.querySelectorAll('.chip');
        
        chips.forEach(chip => {
            chip.addEventListener('click', async () => {
                // Update active state
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                const label = chip.dataset.label;
                this.currentCategory = label;
                
                uiManager.showSkeletons();
                const result = await bloggerAPI.filterByLabel(label);
                uiManager.renderWallpapers(result.wallpapers);
            });
        });
    }

    setupModal() {
        const modalClose = document.getElementById('modalClose');
        const modalBackdrop = document.getElementById('modalBackdrop');
        const modalDownload = document.getElementById('modalDownload');
        const modalShare = document.getElementById('modalShare');
        const modalFavorite = document.getElementById('modalFavorite');
        
        modalClose.addEventListener('click', () => uiManager.closeFullscreen());
        modalBackdrop.addEventListener('click', () => uiManager.closeFullscreen());
        
        modalDownload.addEventListener('click', () => {
            if (uiManager.currentModalWallpaper) {
                uiManager.handleDownload(uiManager.currentModalWallpaper);
            }
        });
        
        modalShare.addEventListener('click', async () => {
            if (uiManager.currentModalWallpaper) {
                try {
                    await navigator.share({
                        title: uiManager.currentModalWallpaper.title,
                        text: 'Check out this wallpaper!',
                        url: uiManager.currentModalWallpaper.imageUrl
                    });
                } catch (err) {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(uiManager.currentModalWallpaper.imageUrl)
                        .then(() => showToast('Link copied to clipboard!'))
                        .catch(() => showToast('Sharing not available'));
                }
            }
        });
        
        modalFavorite.addEventListener('click', () => {
            if (uiManager.currentModalWallpaper) {
                uiManager.handleFavoriteToggle(uiManager.currentModalWallpaper);
                uiManager.closeFullscreen();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                uiManager.closeFullscreen();
            }
        });
    }

    setupInfiniteScroll() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.addEventListener('scroll', async () => {
            if (this.currentPage !== 'home') return;
            
            const { scrollTop, scrollHeight, clientHeight } = mainContent;
            
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                uiManager.showLoading();
                const result = await bloggerAPI.fetchMoreWallpapers();
                uiManager.hideLoading();
                
                if (result.wallpapers.length > 0) {
                    uiManager.renderWallpapers(result.wallpapers, false);
                }
            }
        });
    }

    setupSettings() {
        // Settings panel
        const settingsClose = document.getElementById('settingsClose');
        settingsClose.addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.remove('active');
        });
        
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.addEventListener('change', (e) => {
            document.body.classList.toggle('light-mode', !e.target.checked);
            localStorage.setItem('darkMode', e.target.checked);
        });
        
        // Load saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'false') {
            darkModeToggle.checked = false;
            document.body.classList.add('light-mode');
        }
        
        // Clear favorites
        document.getElementById('clearFavorites').addEventListener('click', () => {
            if (confirm('Clear all favorites?')) {
                localStorage.removeItem('favorites');
                showToast('Favorites cleared');
                if (this.currentPage === 'favorites') {
                    uiManager.renderFavorites();
                }
            }
        });
        
        // View history
        document.getElementById('viewHistory').addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.remove('active');
            uiManager.renderHistory();
            document.getElementById('historyPanel').classList.add('active');
        });
        
        // History panel
        document.getElementById('historyClose').addEventListener('click', () => {
            document.getElementById('historyPanel').classList.remove('active');
        });
        
        // History button in top bar
        document.getElementById('historyBtn').addEventListener('click', () => {
            uiManager.renderHistory();
            document.getElementById('historyPanel').classList.add('active');
        });
    }

    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('pwa/service-worker.js')
                    .then(registration => {
                        console.log('SW registered:', registration.scope);
                    })
                    .catch(err => {
                        console.log('SW registration failed:', err);
                    });
            });
        }
        
        // Install prompt
        let deferredPrompt;
        const installPrompt = document.getElementById('installPrompt');
        const installBtn = document.getElementById('installBtn');
        const dismissBtn = document.getElementById('dismissInstall');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installPrompt.style.display = 'flex';
        });
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Install outcome:', outcome);
                deferredPrompt = null;
                installPrompt.style.display = 'none';
            }
        });
        
        dismissBtn.addEventListener('click', () => {
            installPrompt.style.display = 'none';
        });
        
        window.addEventListener('appinstalled', () => {
            installPrompt.style.display = 'none';
            showToast('App installed successfully!');
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});