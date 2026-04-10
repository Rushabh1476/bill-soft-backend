/**
 * validatePassword.ts
 *
 * Reads the `passwordStrength` setting from localStorage and applies
 * the correct validation rules.
 *
 * When strength === 'strong':
 *   - At least one uppercase letter (A-Z)
 *   - At least one number (0-9)
 *   - At least one special character (!@#$%^&* etc.)
 *
 * When strength === 'weak' (or unset):
 *   - No additional rules — any non-empty password is accepted
 */

export interface PasswordValidationResult {
    valid: boolean;
    error: string;
}

export function validatePassword(password: string): PasswordValidationResult {
    if (!password) {
        return { valid: false, error: 'Password is required' };
    }

    const isStrongMode = localStorage.getItem('passwordStrength') === 'strong';

    if (!isStrongMode) {
        // Weak mode: accept anything non-empty as requested ("without any restrictions")
        return { valid: true, error: '' };
    }

    // Strong mode checks
    if (password.length < 8) {
        return { valid: false, error: 'Strong password must be at least 8 characters.' };
    }
    if (password.length > 16) {
        return { valid: false, error: 'Strong password must be maximum 16 characters.' };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber   = /[0-9]/.test(password);
    // eslint-disable-next-line no-useless-escape
    const hasSpecial  = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

    const missing: string[] = [];
    if (!hasUppercase) missing.push('one uppercase letter');
    if (!hasNumber)    missing.push('one number');
    if (!hasSpecial)   missing.push('one special character');

    if (missing.length > 0) {
        return {
            valid: false,
            error: `Strong password required: must contain at least ${missing.join(', ')}.`,
        };
    }

    return { valid: true, error: '' };
}
