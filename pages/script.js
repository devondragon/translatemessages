// Add loading feedback when form is submitted
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const button = document.querySelector('button[type="submit"]');
    const originalButtonText = button.textContent;
    
    form.addEventListener('submit', function(e) {
        // Disable the button to prevent double submission
        button.disabled = true;
        button.textContent = 'Translating...';
        
        // Add a loading class for potential CSS styling
        button.classList.add('loading');
        
        // If the form submission fails, re-enable the button
        // This is a fallback in case the page doesn't redirect
        setTimeout(function() {
            button.disabled = false;
            button.textContent = originalButtonText;
            button.classList.remove('loading');
        }, 30000); // 30 second timeout
    });
});