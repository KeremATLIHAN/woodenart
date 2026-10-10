const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

// Unicode harfleri, kelimeler arasındaki boşluğu, tireyi ve kesme işaretini kabul eder.
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '\-’][\p{L}\p{M}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeName(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateName(value, fieldLabel) {
    const name = normalizeName(value);
    const errors = [];

    if (!name) return [`${fieldLabel} alanı boş bırakılamaz.`];
    if (name.length < NAME_MIN_LENGTH) errors.push(`${fieldLabel} en az ${NAME_MIN_LENGTH} karakter olmalıdır.`);
    if (name.length > NAME_MAX_LENGTH) errors.push(`${fieldLabel} en fazla ${NAME_MAX_LENGTH} karakter olmalıdır.`);
    if (!NAME_PATTERN.test(name)) {
        errors.push(`${fieldLabel} yalnızca harf, boşluk, tire (-) ve kesme işareti (') içerebilir.`);
    }
    return errors;
}

export function validateFirstName(value) {
    return validateName(value, "Ad");
}

export function validateLastName(value) {
    return validateName(value, "Soyad");
}

export function validateEmail(value) {
    const email = typeof value === "string" ? value : "";
    const errors = [];

    if (!email) return ["E-posta alanı boş bırakılamaz."];
    if (/\s/.test(email)) errors.push("E-posta adresi boşluk içeremez.");
    if (email.length > EMAIL_MAX_LENGTH) errors.push(`E-posta adresi en fazla ${EMAIL_MAX_LENGTH} karakter olmalıdır.`);
    if (!EMAIL_PATTERN.test(email)) errors.push("Geçerli bir e-posta adresi giriniz.");

    return [...new Set(errors)];
}

export function validatePassword(value) {
    const password = typeof value === "string" ? value : "";
    const errors = [];

    if (!password) return ["Parola alanı boş bırakılamaz."];
    if (password.length < PASSWORD_MIN_LENGTH) errors.push(`Parola en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`);
    if (password.length > PASSWORD_MAX_LENGTH) errors.push(`Parola en fazla ${PASSWORD_MAX_LENGTH} karakter olmalıdır.`);
    if (!/\p{Ll}/u.test(password)) errors.push("Parola en az bir küçük harf içermelidir.");
    if (!/\p{Lu}/u.test(password)) errors.push("Parola en az bir büyük harf içermelidir.");
    if (!/\p{N}/u.test(password)) errors.push("Parola en az bir rakam içermelidir.");
    if (!/[^\p{L}\p{N}\s]/u.test(password)) errors.push("Parola en az bir özel karakter içermelidir.");

    return errors;
}

export function validateConfirmPassword(password, confirmPassword) {
    if (typeof confirmPassword !== "string" || !confirmPassword) {
        return ["Parola tekrarı alanı boş bırakılamaz."];
    }
    if (password !== confirmPassword) return ["Parola tekrarı parola ile aynı olmalıdır."];
    return [];
}

export function validatePostalCode(value) {
    const postalCode = typeof value === "string" ? value : "";
    return /^\d{5,6}$/.test(postalCode)
        ? []
        : ["Posta kodu 5 veya 6 rakamdan oluşmalıdır."];
}

export function validateCardNumber(value) {
    const cardNumber = typeof value === "string" ? value.replace(/\s/g, "") : "";
    return /^\d{16}$/.test(cardNumber)
        ? []
        : ["Kart numarası 16 rakamdan oluşmalıdır."];
}

export function validateExpirationDate(value) {
    const expirationDate = typeof value === "string" ? value : "";
    const match = expirationDate.match(/^(\d{2})\/(\d{4})$/);
    if (!match) return ["Son kullanma tarihini AA/YYYY biçiminde giriniz."];

    const month = Number(match[1]);
    if (month < 1 || month > 12) return ["Ay 01 ile 12 arasında olmalıdır."];
    return [];
}

export function validateCvv(value) {
    const cvv = typeof value === "string" ? value : "";
    return /^\d{3}$/.test(cvv)
        ? []
        : ["CVV 3 rakamdan oluşmalıdır."];
}

export function validateRegistration(form) {
    const values = {
        firstName: normalizeName(form?.firstName),
        lastName: normalizeName(form?.lastName),
        email: typeof form?.email === "string" ? form.email : "",
        password: typeof form?.password === "string" ? form.password : "",
        confirmPassword: typeof form?.confirmPassword === "string" ? form.confirmPassword : "",
    };
    const errors = {
        firstName: validateFirstName(values.firstName),
        lastName: validateLastName(values.lastName),
        email: validateEmail(values.email),
        password: validatePassword(values.password),
        confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
    };

    return {
        isValid: Object.values(errors).every((fieldErrors) => fieldErrors.length === 0),
        errors,
        values,
    };
}

// Tek hata mesajı veya false bekleyen eski kullanımlar için.
export function emailValidation(email) {
    return validateEmail(email)[0] || false;
}
