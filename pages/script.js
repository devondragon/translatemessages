// TranslateMessages - Enhanced UI Controller
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.getElementById('file-name');
    const languageInput = document.getElementById('language');
    const languageGrid = document.getElementById('language-grid');
    const languageButtons = languageGrid.querySelectorAll('.language-btn');
    const languagesToggle = document.getElementById('languages-toggle');
    const languagesList = document.getElementById('languages-list');

    const errorMessage = document.getElementById('error-message');
    const warningMessage = document.getElementById('warning-message');
    const successMessage = document.getElementById('success-message');

    // ===== Message Handling =====
    function showMessage(element, text) {
        hideAllMessages();
        element.querySelector('.message-text').textContent = text;
        element.classList.add('visible');
    }

    function hideAllMessages() {
        [errorMessage, warningMessage, successMessage].forEach(el => {
            el.classList.remove('visible');
        });
    }

    function showError(text) {
        showMessage(errorMessage, text);
    }

    function showWarning(text) {
        showMessage(warningMessage, text);
    }

    function showSuccess(text) {
        showMessage(successMessage, text);
    }

    // ===== Loading State =====
    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle('loading', isLoading);
        btnText.textContent = isLoading ? 'Translating...' : 'Translate File';
    }

    // ===== Drop Zone Handling =====
    function updateDropZone(file) {
        if (file) {
            dropZone.classList.add('has-file');
            fileNameDisplay.textContent = file.name;
        } else {
            dropZone.classList.remove('has-file');
            fileNameDisplay.textContent = '';
        }
    }

    fileInput.addEventListener('change', function() {
        updateDropZone(this.files[0]);
    });

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            // Validate file type
            if (file.name.endsWith('.properties')) {
                fileInput.files = files;
                updateDropZone(file);
            } else {
                showError('Please upload a .properties file');
            }
        }
    });

    // ===== Language Selection =====
    languageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Deselect all buttons
            languageButtons.forEach(b => b.classList.remove('selected'));
            // Select this button
            this.classList.add('selected');
            // Update input
            languageInput.value = this.dataset.lang;
            languageInput.classList.add('has-value');
        });
    });

    // Handle custom language input
    languageInput.addEventListener('input', function() {
        const value = this.value.trim();
        this.classList.toggle('has-value', value.length > 0);

        // Deselect buttons if typing custom value
        if (value.length > 0) {
            const matchingBtn = Array.from(languageButtons).find(
                btn => btn.dataset.lang === value.toLowerCase()
            );

            languageButtons.forEach(btn => {
                btn.classList.toggle('selected', btn === matchingBtn);
            });
        } else {
            languageButtons.forEach(btn => btn.classList.remove('selected'));
        }
    });

    // ===== Languages Toggle =====
    languagesToggle.addEventListener('click', function() {
        this.classList.toggle('expanded');
        languagesList.classList.toggle('visible');
    });

    // ===== Form Submission =====
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideAllMessages();

        // Validate language
        if (!languageInput.value.trim()) {
            showError('Please select or enter a target language');
            languageInput.focus();
            return;
        }

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
                showWarning(`${failures} entries could not be translated and were left unchanged.`);
            } else {
                showSuccess('Translation complete! Your file is downloading.');
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

    // ===== Keyboard Accessibility =====
    dropZone.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
});
