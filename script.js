// ===== NRX TOKEN WEBSITE SCRIPT =====
// CLEAN VERSION - NO MINING FUNCTIONALITY

class NRXTokenWebsite {
    constructor() {
        // Configuration - UPDATED WITH YOUR INFO
        this.CONFIG = {
            CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000000', // Replace with your actual contract
            TWITTER_URL: 'https://twitter.com/nrx_info',
            TELEGRAM_URL: 'https://t.me/nrxtoken',
            EMAIL: 'info@nrxproject.com',
            // Note: Removed Discord and GitHub as you don't have them
        };

        // Initialize
        this.initialize();
    }

    initialize() {
        console.log('🚀 NRX Token Website - Initializing...');
        
        // Update contract address
        this.updateContractAddress();
        
        // Update social links
        this.updateSocialLinks();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update stats (simulated data)
        this.updateStats();
        
        console.log('✅ NRX Token Website Ready');
    }

    updateContractAddress() {
        const contractElement = document.getElementById('contract-address');
        if (contractElement) {
            contractElement.textContent = this.CONFIG.CONTRACT_ADDRESS;
            contractElement.title = 'Click to copy contract address';
            
            // Add click to copy functionality
            contractElement.addEventListener('click', () => {
                this.copyToClipboard(this.CONFIG.CONTRACT_ADDRESS);
                this.showNotification('Contract address copied to clipboard!', 'success');
            });
        }
    }

    updateSocialLinks() {
        // Update Twitter link
        const twitterLink = document.querySelector('.social-link.twitter');
        if (twitterLink) {
            twitterLink.href = this.CONFIG.TWITTER_URL;
            twitterLink.target = '_blank';
            twitterLink.rel = 'noopener noreferrer';
            twitterLink.querySelector('span').textContent = '@nrx_info'; // Update display text
        }
        
        // Update Telegram link
        const telegramLink = document.querySelector('.social-link.telegram');
        if (telegramLink) {
            telegramLink.href = this.CONFIG.TELEGRAM_URL;
            telegramLink.target = '_blank';
            telegramLink.rel = 'noopener noreferrer';
        }
        
        // Update Email link
        const emailLink = document.querySelector('.social-link.email');
        if (emailLink) {
            emailLink.href = `mailto:${this.CONFIG.EMAIL}`;
            // No target for email links
        }
        
        // Remove Discord and GitHub links if they exist
        const discordLink = document.querySelector('.social-link.discord');
        const githubLink = document.querySelector('.social-link.github');
        
        if (discordLink) discordLink.style.display = 'none';
        if (githubLink) githubLink.style.display = 'none';
    }

    setupEventListeners() {
        // Add any additional event listeners here
        console.log('Event listeners setup complete');
    }

    updateStats() {
        // Simulated data - replace with real API calls
        const stats = {
            marketCap: '$1,500,000',
            tokenPrice: '$0.0015',
            holders: '8,250'
        };
        
        // Update DOM elements
        const marketCapEl = document.getElementById('market-cap');
        const tokenPriceEl = document.getElementById('token-price');
        const holdersEl = document.getElementById('holders');
        
        if (marketCapEl) marketCapEl.textContent = stats.marketCap;
        if (tokenPriceEl) tokenPriceEl.textContent = stats.tokenPrice;
        if (holdersEl) holdersEl.textContent = stats.holders;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.nrx-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `nrx-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : 
                       type === 'error' ? '#ef4444' : 
                       type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
            animation: notificationSlideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-family: inherit;
        `;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'notificationSlideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes notificationSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes notificationSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nrxWebsite = new NRXTokenWebsite();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NRXTokenWebsite;
    }
