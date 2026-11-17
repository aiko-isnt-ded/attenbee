if (localStorage.getItem('isAuth') === "true" && window.location.pathname.includes('login.html'))
{
    window.location.href = 'main.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('change-password-form');
    
    if (!form) return; 

    form.addEventListener('submit', async (e) => 
    {
        e.preventDefault();

        const current_password = form.current_password.value;
        const new_password = form.new_password.value;
        const confirm_password = form.confirm_password.value;
        const feedback = document.getElementById('password-feedback');

        try 
        {
            const response = await fetch('http://localhost:3000/users/change-password', {
                method: 'PUT',
                headers: 
                {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ current_password, new_password, confirm_password })
            });

            const result = await response.json();
            console.log(result);

            if (result.success) 
            {
                feedback.style.color = 'green';
                feedback.textContent = result.message;

                setTimeout(() => 
                {
                    form.reset();
                    feedback.textContent = '';
                    document.getElementById('settings-modal').close();
                }, 1500);
            } else 
            {
                feedback.style.color = 'red';
                feedback.textContent = result.message || "Error al actualizar";
            }
        } 
        catch (err) 
        {
            feedback.style.color = 'red';
            feedback.textContent = 'Error de conexión al servidor';
            console.error(err);
        }
    });

    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) =>
    {
        e.preventDefault();

        const password = loginForm.password.value;
        try
        {
            const response = await fetch('http://localhost:3000/users/login',
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({password})
            });

            const result = await response.json();
            if (result.success)
            {
                localStorage.setItem('isAuth', 'true');
                window.location.href = 'main.html'
            } else
            {
                alert(result.message || "Error al iniciar sesión, verifica la contraseña");
            }
        } catch (err)
        {
            console.error("error de conexión: ", err);
        }
    })
});