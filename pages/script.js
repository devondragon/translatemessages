// Handle form submission with fetch API for better error handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const button = document.querySelector('button[type="submit"]');
    const originalButtonText = button.textContent;
    const errorContainer = document.getElementById('error-message');

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.hidden = false;
    }

    function hideError() {
        errorContainer.hidden = true;
        errorContainer.textContent = '';
    }

    function setLoading(isLoading) {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Translating...' : originalButtonText;
        button.classList.toggle('loading', isLoading);
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();
        setLoading(true);

        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                showError(errorText || `Error: ${response.status} ${response.statusText}`);
                setLoading(false);
                return;
            }

            // Check for translation failures header
            const failures = response.headers.get('X-Translation-Failures');
            if (failures && parseInt(failures, 10) > 0) {
                showError(`Warning: ${failures} entries could not be translated and were left unchanged.`);
            }

            // Get filename from Content-Disposition header
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'messages_translated.properties';
            if (disposition) {
                const match = disposition.match(/filename="([^"]+)"/);
                if (match) {
                    filename = match[1];
                }
            }

            // Download the file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            showError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    });
});
