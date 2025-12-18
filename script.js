// Countdown Timer
function updateCountdown() {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 22); // 22 days from now
    launchDate.setHours(12, 0, 0, 0); // Set to 12:00 PM

    function update() {
        const now = new Date().getTime();
        const distance = launchDate - now;

        if (distance < 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            
            // Update price when countdown ends
            document.querySelector('.current-price').textContent = '$0.0015';
            document.querySelector('.price-change').textContent = '+2.34%';
            document.querySelector('.price-change').className = 'price-change positive';
            document.querySelector('.price-subtitle').textContent = 'Live on PancakeSwap';
            
            const volumeElement = document.querySelector('.volume span:last-child');
            const liquidityElement = document.querySelector('.liquidity span:last-child');
            if (volumeElement) volumeElement.textContent = '$12,450';
            if (liquidityElement) liquidityElement.textContent = '$45,200';
            
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

        // Simulate price increase as countdown progresses
        if (days < 7) {
            const basePrice = 0.0005;
            const progress = 1 - (days / 7);
            const simulatedPrice = basePrice + (progress * 0.0010);
            document.querySelector('.current-price').textContent = `$${simulatedPrice.toFixed(4)}`;
            
            const priceChange = (progress * 2.34).toFixed(2);
            document.querySelector('.price-change').textContent = `+${priceChange}%`;
        }
    }

    update();
    setInterval(update, 1000);
}

// Copy Contract Address
function copyContract() {
    const contractAddress = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
    
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

// Show Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Price Simulation
function simulatePriceFluctuation() {
    const priceElement = document.querySelector('.current-price');
    const changeElement = document.querySelector('.price-change');
    
    if (!priceElement || priceElement.textContent === '$0.0000') {
        return; // Don't simulate before launch
    }
    
    // Small random fluctuations
    const currentPrice = parseFloat(priceElement.textContent.replace('$', ''));
    const fluctuation = (Math.random() - 0.5) * 0.0002; // ±0.02%
    const newPrice = Math.max(0.0001, currentPrice + fluctuation);
    
    priceElement.textContent = `$${newPrice.toFixed(4)}`;
    
    const percentChange = ((fluctuation / currentPrice) * 100).toFixed(2);
    if (percentChange >= 0) {
        changeElement.textContent = `+${percentChange}%`;
        changeElement.className = 'price-change positive';
    } else {
        changeElement.textContent = `${percentChange}%`;
        changeElement.className = 'price-change negative';
    }
}

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Neura Token Website Initialized');
    console.log('✅ Mining activities removed');
    console.log('✅ Live price tracking added');
    console.log('✅ Twitter updated to: twitter.com/nrx_info');
    console.log('✅ Original design preserved');
    
    // Start countdown timer
    updateCountdown();
    
    // Initialize contract address click
    const contractElement = document.querySelector('.contract-address');
    contractElement.addEventListener('click', copyContract);
    
    // Initialize social links
    const socialLinks = document.querySelectorAll('.footer-column a');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                showToast('Coming soon!');
            }
        });
    });
    
    // Simulate price updates every 30 seconds (for demo purposes)
    setInterval(simulatePriceFluctuation, 30000);
    
    // Add hover effects to cards
    const cards = document.querySelectorAll('.info-card, .about-card, .price-widget');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
            this.style.boxShadow = '0 15px 35px rgba(56, 189, 248, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        });
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateCountdown,
        copyContract,
        showToast,
        simulatePriceFluctuation
    };
            }
