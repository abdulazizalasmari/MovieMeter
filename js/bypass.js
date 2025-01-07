async function checkAuth() {
    try {
        const response = await fetch('../php/bypass.php');
        const data = await response.json();
        
        if (data.error === 'Not authenticated') {
            window.location.replace('../html/index.html?action=unauthorized');
            return;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.replace('../html/index.html?action=unauthorized');
    }
}

checkAuth();