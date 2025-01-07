document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'signout') {
        showToast('Successfully signed out!', { backgroundColor: "#33CC33" });
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('action') === 'unauthorized') {
        showToast('Please sign in to access this page', { backgroundColor: "#FF3333" });
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const authForm = document.getElementById('signin-form');
    const toggleLink = document.querySelector('.toggle-link');
    const signupModal = document.getElementById('signup-modal');
    const closeModal = document.querySelector('.close');
    const signupFormModal = document.getElementById('signup-form-modal');

    if (!authForm || !toggleLink || !signupModal || !closeModal || !signupFormModal) {
        console.error('Required elements not found');
        return;
    }

    const inputs = document.querySelectorAll('.signin-container input');
    inputs.forEach((input, index) => {
        input.style.setProperty('--i', index);
    });

    authForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(this);

        if (!this.checkValidity()) {
            const invalidInputs = this.querySelectorAll(':invalid');
            invalidInputs.forEach(input => {
                input.classList.add('error');
                input.addEventListener('animationend', () => {
                    input.classList.remove('error');
                }, { once: true });
            });
            return;
        }

        fetch('../php/auth.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
            .then(response => response.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (data.status === 'exists') {
                        if (formData.get('action') === 'Sign Up') {
                            showToast('Account already exists. Please enter your password.', { backgroundColor: "#FFCC33" });
                        } else {
                            showPasswordField(formData.get('email'));
                        }
                    } else if (data.status === 'not_exists') {
                        signupModal.classList.add('show');
                        document.querySelector('#signup-form-modal input[name="email"]').value = formData.get('email');
                        showToast('Email does not exist. Please sign up.', { backgroundColor: "#FFCC33" });
                    } else if (data.status === 'success') {
                        const passwordInput = document.querySelector('#password');
                        if (passwordInput) {
                            passwordInput.classList.remove('error');
                        }
                        showToast('Sign in successful!', { backgroundColor: "#33CC33" });
                        window.location.href = '../html/homepage.html';
                    } else {
                        const passwordInput = document.querySelector('#password');
                        if (passwordInput) {
                            passwordInput.classList.add('error');
                            passwordInput.focus();

                            passwordInput.addEventListener('input', function () {
                                this.classList.remove('error');
                            }, { once: true });
                        }
                        showToast(data.message, { backgroundColor: "#FF3333" });
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    console.error('Response text:', text);
                    showToast('An error occurred. Please try again', { backgroundColor: "#FF3333" });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred. Please try again', { backgroundColor: "#FF3333" });
            });
    });

    toggleLink.addEventListener('click', function (event) {
        event.preventDefault();
        signupModal.classList.add('show');
    });

    closeModal.addEventListener('click', function () {
        signupModal.classList.remove('show');
    });

    window.addEventListener('click', function (event) {
        if (event.target == signupModal) {
            signupModal.classList.remove('show');
        }
    });

    signupFormModal.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(this);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');

        const { isValid } = validatePassword(password);
        if (!isValid) {
            showToast('Password does not meet security requirements', { backgroundColor: "#FF3333" });
            const passwordInput = this.querySelector('input[name="password"]');
            if (passwordInput) {
                passwordInput.classList.add('error');
                passwordInput.focus();

                passwordInput.addEventListener('input', function () {
                    this.classList.remove('error');
                }, { once: true });
            }
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', { backgroundColor: "#FF3333" });
            const confirmPasswordInput = this.querySelector('input[name="confirm-password"]');
            if (confirmPasswordInput) {
                confirmPasswordInput.classList.add('error');
                confirmPasswordInput.focus();

                confirmPasswordInput.addEventListener('input', function () {
                    this.classList.remove('error');
                }, { once: true });
            }
            return;
        }

        fetch('../php/auth.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
            .then(response => response.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (data.status === 'success') {
                        showToast('Sign up successful!', { backgroundColor: "#33CC33" });
                        window.location.href = '../html/homepage.html?signup=success';
                    } else if (data.status === 'exists') {
                        signupModal.style.display = 'none';
                        showPasswordField(formData.get('email'));
                        showToast('Account already exists. Please enter your password.', { backgroundColor: "#FFCC33" });
                    } else {
                        showToast(data.message, { backgroundColor: "#FF3333" });
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    console.error('Response text:', text);
                    showToast('An error occurred. Please try again', { backgroundColor: "#FF3333" });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred. Please try again', { backgroundColor: "#FF3333" });
            });
    });

    signupFormModal.addEventListener('input', function (e) {
        if (e.target.name === 'password') {
            updatePasswordStrength(e.target.value);
        }
    });

    function showPasswordField(email) {
        const authForm = document.getElementById('signin-form');
        const passwordContainer = authForm.querySelector('#password-container');

        if (!authForm || !passwordContainer) return;

        passwordContainer.style.display = 'block';
        void passwordContainer.offsetWidth;
        passwordContainer.classList.add('show');

        const actionInput = document.getElementById('action');
        if (actionInput) {
            actionInput.value = 'Sign In';
        }

        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = email;
            emailInput.readOnly = true;
        }
    }

    function setupPasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.removeEventListener('click', togglePassword);
            button.addEventListener('click', togglePassword);
        });
    }

    function togglePassword(e) {
        const button = e.currentTarget;
        const container = button.closest('.password-container');
        const input = container.querySelector('input');
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        button.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    }

    setupPasswordToggles();

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length) {
                setupPasswordToggles();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

const passwordRequirements = {
    minLength: 8,
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
};

function validatePassword(password) {
    const checks = {
        length: password.length >= passwordRequirements.minLength,
        uppercase: passwordRequirements.hasUpperCase.test(password),
        lowercase: passwordRequirements.hasLowerCase.test(password),
        number: passwordRequirements.hasNumber.test(password),
        special: passwordRequirements.hasSpecial.test(password)
    };

    const strength = Object.values(checks).filter(Boolean).length;
    const strengthPercentage = (strength / 5) * 100;
    return { isValid: strength === 5, strength: strengthPercentage, checks };
}

function updatePasswordStrength(password) {
    const strengthMeter = document.querySelector('.strength-meter');
    const requirements = document.querySelectorAll('.requirement');

    if (!strengthMeter || !requirements.length) return;

    const { strength, checks } = validatePassword(password);

    strengthMeter.style.width = `${strength}%`;

    if (strength <= 20) {
        strengthMeter.style.backgroundColor = '#FF3333';
    } else if (strength <= 40) {
        strengthMeter.style.backgroundColor = '#FFA500';
    } else if (strength <= 60) {
        strengthMeter.style.backgroundColor = '#FFD700';
    } else if (strength <= 80) {
        strengthMeter.style.backgroundColor = '#9ACD32';
    } else {
        strengthMeter.style.backgroundColor = '#33CC33';
    }

    requirements.forEach(req => {
        const type = req.dataset.requirement;
        if (checks[type]) {
            req.classList.remove('unmet');
            req.classList.add('met');
        } else {
            req.classList.remove('met');
            req.classList.add('unmet');
        }
    });
}
