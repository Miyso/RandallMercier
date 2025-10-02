// News RSS Feed Handler
class NewsManager {
    constructor(rssUrl, containerId) {
        this.rssUrl = rssUrl;
        this.containerId = containerId;
        this.newsData = [];
    }

    // Fetch RSS feed and convert to JSON
    async fetchRSSFeed() {
        try {
            // Use a CORS proxy to fetch the RSS feed
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(this.rssUrl));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const rssText = data.contents;
            
            // Parse RSS XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rssText, 'text/xml');
            
            // Check for XML parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML parsing error: ' + parseError.textContent);
            }
            
            return this.parseRSSToJSON(xmlDoc);
        } catch (error) {
            console.error('Error fetching RSS feed:', error);
            return this.getFallbackNews();
        }
    }

    // Parse RSS XML to JSON format
    parseRSSToJSON(xmlDoc) {
        const items = xmlDoc.querySelectorAll('item');
        const newsItems = [];

        items.forEach((item, index) => {
            // Limit to first 3 items
            if (index < 3) {
                const title = item.querySelector('title')?.textContent || 'No Title';
                const description = item.querySelector('description')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
                const link = item.querySelector('link')?.textContent || '#';
                
                // Clean description: remove FetchRSS attribution and title duplication
                let cleanDescription = this.cleanHTML(description);
                cleanDescription = this.removeFetchRSSAttribution(cleanDescription);
                cleanDescription = this.removeTitleFromDescription(cleanDescription, title);
                cleanDescription = cleanDescription.substring(0, 150) + '...';
                
                // Parse date
                const date = new Date(pubDate);
                
                newsItems.push({
                    title: this.truncateTitle(title),
                    description: cleanDescription,
                    link: link,
                    date: {
                        month: date.toLocaleDateString('en-US', { month: 'short' }),
                        day: date.getDate().toString().padStart(2, '0'),
                        year: date.getFullYear()
                    }
                });
            }
        });

        return newsItems;
    }

    // Remove FetchRSS attribution from description
    removeFetchRSSAttribution(text) {
        // Remove various forms of FetchRSS attribution
        return text
            .replace(/\(Feed generated with FetchRSS\)/gi, '')
            .replace(/Feed generated with FetchRSS/gi, '')
            .replace(/\(Generated with FetchRSS\)/gi, '')
            .replace(/Generated with FetchRSS/gi, '')
            .replace(/\s+/g, ' ') // Clean up extra whitespace
            .trim();
    }

    // Remove title from description if it appears at the beginning
    removeTitleFromDescription(description, title) {
        // Clean title for comparison (remove special characters)
        const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
        const cleanDescription = description.replace(/[^\w\s]/g, '').trim();
        
        // If description starts with the title, remove it
        if (cleanDescription.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
            // Find where the title ends in the original description
            const titleWords = cleanTitle.split(' ').length;
            const descriptionWords = description.split(' ');
            
            // Remove the first titleWords number of words plus a few extra to be safe
            const remainingWords = descriptionWords.slice(titleWords + 1);
            return remainingWords.join(' ').trim();
        }
        
        return description;
    }

    // Clean HTML tags from text
    cleanHTML(text) {
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
    }

    // Truncate title if too long
    truncateTitle(title) {
        return title.length > 60 ? title.substring(0, 60) + '...' : title;
    }

    // Fallback news data in case RSS feed fails
    getFallbackNews() {
        return [
            {
                title: 'Annual Flu Vaccination Now Available',
                description: 'Protect yourself and your family this flu season. Schedule your annual flu vaccination today for optimal protection.',
                link: '#',
                date: {
                    month: 'Sep',
                    day: '15',
                    year: '2025'
                }
            },
            {
                title: 'Heart Health Awareness Month',
                description: 'Learn about the importance of cardiovascular health and simple lifestyle changes that can make a significant difference.',
                link: '#',
                date: {
                    month: 'Sep',
                    day: '08',
                    year: '2025'
                }
            },
            {
                title: 'New Telehealth Services Available',
                description: 'We are now offering convenient telehealth consultations for follow-up appointments and routine check-ins.',
                link: '#',
                date: {
                    month: 'Aug',
                    day: '28',
                    year: '2025'
                }
            }
        ];
    }

    // Populate news cards in the DOM
    populateNewsCards(newsData) {
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) {
            console.error('News grid container not found');
            return;
        }

        // Clear existing news cards
        newsGrid.innerHTML = '';

        newsData.forEach(item => {
            const newsCard = this.createNewsCard(item);
            newsGrid.appendChild(newsCard);
        });

        // Re-initialize animations for new elements
        if (typeof initScrollAnimations === 'function') {
            setTimeout(() => {
                const observer = new IntersectionObserver(function(entries) {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('fade-in-up');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

                const newCards = document.querySelectorAll('.news-card');
                newCards.forEach(card => observer.observe(card));
            }, 100);
        }
    }

    // Create a single news card element
    createNewsCard(item) {
        const article = document.createElement('article');
        article.className = 'news-card';
        
        article.innerHTML = `
            <div class="news-date">
                <span class="date-month">${item.date.month}</span>
                <span class="date-day">${item.date.day}</span>
                <span class="date-year">${item.date.year}</span>
            </div>
            <div class="news-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <a href="${item.link}" class="news-link" ${item.link.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                    Read More <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        
        return article;
    }

    // Initialize the news manager
    async init() {
        console.log('Fetching health news...');
        
        // Show loading state
        this.showLoadingState();
        
        try {
            const newsData = await this.fetchRSSFeed();
            this.newsData = newsData;
            this.populateNewsCards(newsData);
            console.log('Health news loaded successfully:', newsData);
        } catch (error) {
            console.error('Failed to load news:', error);
            // Use fallback data
            const fallbackData = this.getFallbackNews();
            this.populateNewsCards(fallbackData);
        }
    }

    // Show loading state
    showLoadingState() {
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="news-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading latest health news...</p>
                </div>
            `;
        }
    }

    // Refresh news data
    async refresh() {
        await this.init();
    }
}

// Initialize news manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the main script to load
    setTimeout(() => {
        const newsManager = new NewsManager(
            'https://fetchrss.com/feed/aM7HmlnzFMJyaM7GowXkU0ai.rss',
            'news-grid'
        );
        
        newsManager.init();
        
        // Make it globally accessible for debugging
        window.newsManager = newsManager;
    }, 500);
});