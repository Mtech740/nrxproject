// Launch countdown functionality
const launchDate = new Date();
launchDate.setDate(launchDate.getDate() + 22); // Set launch to 22 days from now

function updateLaunchCountdown() {
    const now = new Date().getTime();
    const distance = launchDate - now;
    
    if (distance < 0) {
        document.getElementById('launchCountdown').textContent = 'Launch imminent!';
        document.getElementById('priceValue').textContent = '$0.00';
        return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById('launchCountdown').textContent = `Launch in: ${days}d ${hours}h ${minutes}m`;
    
    // Simulate price increase as launch approaches
    if (days < 7) {
        const basePrice = 0.005;
        const progress = 1 - (days / 7);
        const simulatedPrice = basePrice + (progress * 0.015);
        document.getElementById('priceValue').textContent = `$${simulatedPrice.toFixed(4)}`;
    }
}

// Copy contract address to clipboard
function copyContractAddress() {
    const contractAddress = document.getElementById('contractAddress').textContent;
    
    navigator.clipboard.writeText(contractAddress).then(() => {
        showToast('Contract address copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = contractAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Contract address copied to clipboard!');
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Price simulation for demo purposes
function simulatePriceUpdate() {
    const priceElement = document.getElementById('priceValue');
    const currentText = priceElement.textContent;
    
    if (currentText === '$0.00') {
        // Only simulate if price is still at $0.00
        const now = new Date();
        const launchTime = launchDate.getTime();
        const currentTime = now.getTime();
        const timeLeft = launchTime - currentTime;
        
        if (timeLeft < 7 * 24 * 60 * 60 * 1000) { // Less than 7 days
            const progress = 1 - (timeLeft / (7 * 24 * 60 * 60 * 1000));
            const simulatedPrice = 0.005 + (progress * 0.015);
            priceElement.textContent = `$${simulatedPrice.toFixed(4)}`;
        }
    }
}

// Initialize tooltips
function initTooltips() {
    const contractElement = document.getElementById('contractAddress');
    contractElement.title = 'Click to copy contract address';
    
    const copyButton = document.querySelector('.copy-btn');
    copyButton.title = 'Copy to clipboard';
}

// Add hover effects to cards
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.token-info-card, .price-card, .about-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 30, 100, 0.35)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 15px 35px rgba(0, 30, 100, 0.3)';
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize countdown
    updateLaunchCountdown();
    
    // Update countdown every minute
    setInterval(updateLaunchCountdown, 60000);
    
    // Simulate price updates every 5 minutes
    setInterval(simulatePriceUpdate, 300000);
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize card hover effects
    initCardHoverEffects();
    
    // Add click effect to contract address
    const contractAddress = document.getElementById('contractAddress');
    contractAddress.addEventListener('click', copyContractAddress);
    
    // Add click effect to social links
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                showToast('Coming soon!');
            }
        });
    });
    
    // Add click effect to footer links
    const footerLinks = document.querySelectorAll('.footer-link');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                showToast('Page coming soon!');
            }
        });
    });
    
    // Initial price simulation check
    simulatePriceUpdate();
    
    console.log('Neura Token website initialized successfully!');
    console.log('Twitter updated to: twitter.com/nrx_info');
    console.log('Live price tracking placeholder added');
    console.log('All mining activities removed');
});

// Export functions for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateLaunchCountdown,
        copyContractAddress,
        showToast,
        simulatePriceUpdate
    };
}
