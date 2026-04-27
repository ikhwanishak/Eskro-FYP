export const ALLOWED_ADMINS = ["ikhwanishak2001@gmail.com"];

export const sessionOptions = {
    cookieName: "escrow_app_session",
    password: process.env.SECRET_COOKIE_PASSWORD || "complex_password_at_least_32_characters_long",
    // Set cookie settings for Cybersecurity standards
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes absolute session timeout
        sameSite: "strict", // Prevent CSRF attacks
        httpOnly: true, // Prevent XSS stealing cookie
    },
};

export function isAdmin(email) {
    return ALLOWED_ADMINS.includes(email);
}
