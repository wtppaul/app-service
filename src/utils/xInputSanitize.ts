// utils/sanitizeInput.ts
import xss from 'xss';

type InputValue = string | Record<string, any> | any;

const sanitizeInput = (input: InputValue): InputValue => {
  if (typeof input === 'string') {
    return xss(input.trim());
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)); // array tetap array
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, any> = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }

  return input;
};

export default sanitizeInput;
