document.addEventListener('DOMContentLoaded', () =>
{
    const isAuth = localStorage.getItem('isAuth');
    const current_path = window.location.pathname;

    if (isAuth !== 'true' && !current_path.includes('login.html'))
    {
        window.location.href = 'login.html';
    }
});