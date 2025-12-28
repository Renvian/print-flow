async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // Redirect logic
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/PrintSystem/');
    
    if (isLoginPage && session) {
        if (session.user.email === 'admin@college.com') window.location.href = 'admin.html';
        else window.location.href = 'student.html';
    } 
    else if (!isLoginPage && !session) {
        window.location.href = 'index.html';
    }
    return session;
}

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Error: " + error.message);
    else alert("Sign up successful! You can now log in.");
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Login failed: " + error.message);
    else {
        if(email === 'admin@college.com') window.location.href = 'admin.html';
        else window.location.href = 'student.html';
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}