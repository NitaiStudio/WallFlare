/**
 * Blogger API Integration Module
 * Handles fetching wallpapers from Blogger API
 */

const API_CONFIG = {
    // REPLACE THESE WITH YOUR ACTUAL BLOGGER API CREDENTIALS
    BLOG_ID: 'YOUR_BLOG_ID',  // Replace with your Blogger blog ID
    API_KEY: 'YOUR_API_KEY',   // Replace with your Google API key
    BASE_URL: 'https://www.googleapis.com/blogger/v3/blogs',
    MAX_RESULTS: 20
};

class BloggerAPI {
    constructor() {
        this.nextPageToken = null;
        this.currentLabel = null;
        this.currentSearch = null;
        this.isLoading = false;
    }

    /**
     * Build the API URL with parameters
     */
    buildUrl(params = {}) {
        const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.BLOG_ID}/posts`;
        const queryParams = new URLSearchParams({
            key: API_CONFIG.API_KEY,
            maxResults: params.maxResults || API_CONFIG.MAX_RESULTS,
            fetchImages: true,
            fields: 'items(id,title,content,labels,url),nextPageToken'
        });

        if (params.pageToken) {
            queryParams.append('pageToken', params.pageToken);
        }
        if (params.label && params.label !== 'all') {
            queryParams.append('labels', params.label);
        }
        if (params.search) {
            queryParams.append('q', params.search);
        }

        return `${url}?${queryParams.toString()}`;
    }

    /**
     * Extract image URL from post content HTML
     */
    extractImageUrl(content) {
        if (!content) return null;
        
        // Try to find img src in HTML content
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
            let url = imgMatch[1];
            // Remove Blogger's default sizing parameters for full resolution
            url = url.replace(/\/s\d+-c\//, '/s0/');
            url = url.replace(/\/w\d+-h\d+-c/, '/s0');
            url = url.replace(/=w\d+-h\d+-c/, '=s0');
            return url;
        }
        
        // Try to find direct image links
        const linkMatch = content.match(/https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/i);
        if (linkMatch) return linkMatch[0];
        
        return null;
    }

    /**
     * Determine resolution label from image URL or content
     */
    getResolutionLabel(content) {
        if (!content) return 'HD';
        if (content.includes('3840') || content.includes('2160') || content.includes('4K') || content.includes('4k')) {
            return '4K';
        }
        if (content.includes('1920') || content.includes('1080')) {
            return 'HD';
        }
        // Default based on content clues
        const imgMatch = content.match(/<img[^>]+/);
        if (imgMatch && (imgMatch[0].includes('s1600') || imgMatch[0].includes('s0'))) {
            return '4K';
        }
        return 'HD';
    }

    /**
     * Parse post data into wallpaper object
     */
    parsePost(post) {
        const imageUrl = this.extractImageUrl(post.content);
        if (!imageUrl) return null;

        return {
            id: post.id,
            title: post.title || 'Untitled Wallpaper',
            imageUrl: imageUrl,
            thumbnailUrl: imageUrl.replace(/\/s0\//, '/s400/').replace(/=s0/, '=w400'),
            labels: post.labels || [],
            resolution: this.getResolutionLabel(post.content),
            url: post.url
        };
    }

    /**
     * Fetch wallpapers from API
     */
    async fetchWallpapers(options = {}) {
        if (this.isLoading) return { wallpapers: [], nextPageToken: null };
        this.isLoading = true;

        try {
            const url = this.buildUrl({
                label: options.label || this.currentLabel,
                search: options.search || this.currentSearch,
                pageToken: options.pageToken || null,
                maxResults: options.maxResults || API_CONFIG.MAX_RESULTS
            });

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            this.nextPageToken = data.nextPageToken || null;
            
            const wallpapers = (data.items || [])
                .map(post => this.parsePost(post))
                .filter(wp => wp !== null);

            return {
                wallpapers,
                nextPageToken: this.nextPageToken
            };
        } catch (error) {
            console.error('Error fetching wallpapers:', error);
            return { wallpapers: [], nextPageToken: null, error: error.message };
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Fetch wallpapers for infinite scroll
     */
    async fetchMoreWallpapers() {
        if (!this.nextPageToken || this.isLoading) {
            return { wallpapers: [], nextPageToken: null };
        }

        return this.fetchWallpapers({ pageToken: this.nextPageToken });
    }

    /**
     * Search wallpapers
     */
    async searchWallpapers(query) {
        this.currentSearch = query;
        this.nextPageToken = null;
        return this.fetchWallpapers({ search: query });
    }

    /**
     * Filter by category/label
     */
    async filterByLabel(label) {
        this.currentLabel = label;
        this.currentSearch = null;
        this.nextPageToken = null;
        return this.fetchWallpapers({ label: label });
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.currentLabel = null;
        this.currentSearch = null;
        this.nextPageToken = null;
    }
}

// Create global instance
const bloggerAPI = new BloggerAPI();