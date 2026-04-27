/**
 * 🎯 FORM VALIDATION UTILITIES
 * 
 * Comprehensive form validation with user-friendly error messages
 * 
 * @version 2.0.0
 */

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

export function validateEmail(email: string): ValidationResult {
  const trimmedEmail = email.trim();
  
  if (!trimmedEmail) {
    return {
      isValid: false,
      error: 'E-posta adresi gereklidir',
    };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Geçerli bir e-posta adresi giriniz',
    };
  }

  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: 'E-posta adresi çok uzun',
    };
  }

  return { isValid: true };
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return {
      isValid: false,
      error: 'Şifre gereklidir',
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: 'Şifre en az 6 karakter olmalıdır',
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Şifre çok uzun',
    };
  }

  // Check for at least one number and one letter for better security
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  if (!hasNumber || !hasLetter) {
    return {
      isValid: false,
      error: 'Şifre en az bir harf ve bir rakam içermelidir',
    };
  }

  return { isValid: true };
}

// ============================================================================
// NAME VALIDATION
// ============================================================================

export function validateName(name: string, fieldName: string = 'İsim'): ValidationResult {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return {
      isValid: false,
      error: `${fieldName} gereklidir`,
    };
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: `${fieldName} en az 2 karakter olmalıdır`,
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: `${fieldName} çok uzun (max 100 karakter)`,
    };
  }

  // Allow letters, spaces, and Turkish characters
  const nameRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ\s'-]+$/;
  
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: `${fieldName} sadece harf içermelidir`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// NUMBER RANGE VALIDATION
// ============================================================================

export function validateNumberRange(
  value: string | number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return {
      isValid: false,
      error: `Geçerli bir ${fieldName.toLowerCase()} giriniz`,
    };
  }

  if (num < min) {
    return {
      isValid: false,
      error: `${fieldName} en az ${min} olmalıdır`,
    };
  }

  if (num > max) {
    return {
      isValid: false,
      error: `${fieldName} en fazla ${max} olabilir`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// AGE VALIDATION
// ============================================================================

export function validateAge(age: string | number): ValidationResult {
  return validateNumberRange(age, 13, 120, 'Yaş');
}

// ============================================================================
// WEIGHT VALIDATION
// ============================================================================

export function validateWeight(weight: string | number): ValidationResult {
  return validateNumberRange(weight, 20, 500, 'Kilo');
}

// ============================================================================
// HEIGHT VALIDATION
// ============================================================================

export function validateHeight(height: string | number): ValidationResult {
  return validateNumberRange(height, 50, 300, 'Boy');
}

// ============================================================================
// CALORIES VALIDATION
// ============================================================================

export function validateCalories(calories: string | number): ValidationResult {
  return validateNumberRange(calories, 0, 10000, 'Kalori');
}

// ============================================================================
// MACROS VALIDATION (Protein, Carbs, Fats)
// ============================================================================

export function validateMacro(macro: string | number, macroName: string): ValidationResult {
  return validateNumberRange(macro, 0, 500, macroName);
}

// ============================================================================
// REQUIRED FIELD VALIDATION
// ============================================================================

export function validateRequired(value: string, fieldName: string): ValidationResult {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: `${fieldName} gereklidir`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// SELECT VALIDATION (Dropdown)
// ============================================================================

export function validateSelect(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `Lütfen ${fieldName.toLowerCase()} seçiniz`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// FULL FORM VALIDATORS
// ============================================================================

/**
 * Validate full meal form data
 */
export interface MealFormData {
  mealName: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  mealType: string;
}

export function validateMealForm(data: MealFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate meal name
  const nameResult = validateRequired(data.mealName, 'Yemek adı');
  if (!nameResult.isValid && nameResult.error) {
    errors.mealName = nameResult.error;
  }

  // Validate meal type
  const mealTypeResult = validateSelect(data.mealType, 'Öğün türü');
  if (!mealTypeResult.isValid && mealTypeResult.error) {
    errors.mealType = mealTypeResult.error;
  }

  // Validate calories (optional but if provided must be valid)
  if (data.calories) {
    const caloriesResult = validateCalories(data.calories);
    if (!caloriesResult.isValid && caloriesResult.error) {
      errors.calories = caloriesResult.error;
    }
  }

  // Validate protein (optional but if provided must be valid)
  if (data.protein) {
    const proteinResult = validateMacro(data.protein, 'Protein');
    if (!proteinResult.isValid && proteinResult.error) {
      errors.protein = proteinResult.error;
    }
  }

  // Validate carbs (optional but if provided must be valid)
  if (data.carbs) {
    const carbsResult = validateMacro(data.carbs, 'Karbonhidrat');
    if (!carbsResult.isValid && carbsResult.error) {
      errors.carbs = carbsResult.error;
    }
  }

  // Validate fats (optional but if provided must be valid)
  if (data.fats) {
    const fatsResult = validateMacro(data.fats, 'Yağ');
    if (!fatsResult.isValid && fatsResult.error) {
      errors.fats = fatsResult.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate profile form data
 */
export interface ProfileFormData {
  fullName: string;
  age: string;
  weight: string;
  height: string;
  gender: string;
  activityLevel: string;
}

export function validateProfileForm(data: ProfileFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate full name
  const nameResult = validateName(data.fullName, 'İsim Soyisim');
  if (!nameResult.isValid && nameResult.error) {
    errors.fullName = nameResult.error;
  }

  // Validate age
  const ageResult = validateAge(data.age);
  if (!ageResult.isValid && ageResult.error) {
    errors.age = ageResult.error;
  }

  // Validate weight
  const weightResult = validateWeight(data.weight);
  if (!weightResult.isValid && weightResult.error) {
    errors.weight = weightResult.error;
  }

  // Validate height
  const heightResult = validateHeight(data.height);
  if (!heightResult.isValid && heightResult.error) {
    errors.height = heightResult.error;
  }

  // Validate gender
  const genderResult = validateSelect(data.gender, 'Cinsiyet');
  if (!genderResult.isValid && genderResult.error) {
    errors.gender = genderResult.error;
  }

  // Validate activity level
  const activityResult = validateSelect(data.activityLevel, 'Aktivite seviyesi');
  if (!activityResult.isValid && activityResult.error) {
    errors.activityLevel = activityResult.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
}

export function validateLoginForm(data: LoginFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  // Validate password (only check if not empty for login)
  if (!data.password) {
    errors.password = 'Şifre gereklidir';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate signup form data
 */
export interface SignupFormData extends LoginFormData {
  fullName: string;
}

export function validateSignupForm(data: SignupFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate full name
  const nameResult = validateName(data.fullName, 'İsim Soyisim');
  if (!nameResult.isValid && nameResult.error) {
    errors.fullName = nameResult.error;
  }

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  // Validate password (strict validation for signup)
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid && passwordResult.error) {
    errors.password = passwordResult.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
