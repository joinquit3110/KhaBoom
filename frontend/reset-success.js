// Reset Success Handler
// This code shows a success modal when the URL contains reset=success parameter

document.addEventListener('DOMContentLoaded', function() {
    // Check if the URL contains the reset=success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'success') {
        // Show the reset success modal
        const resetSuccessModal = document.querySelector('#reset-success');
        if (resetSuccessModal) {
            resetSuccessModal.classList.add('on');
            
            // Remove the parameter from URL without reloading the page
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }
});
