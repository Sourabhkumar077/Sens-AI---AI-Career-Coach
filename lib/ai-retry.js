// Utility for retrying AI calls with exponential backoff
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors or auth errors
      if (error.message?.includes('validation') || 
          error.message?.includes('auth') || 
          error.message?.includes('unauthorized')) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`AI call failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Safe AI call wrapper
export async function safeAICall(fn, fallbackData = null) {
  try {
    return await retryWithBackoff(fn);
  } catch (error) {
    console.error('AI call failed after retries:', error);
    
    if (fallbackData) {
      console.log('Using fallback data');
      return fallbackData;
    }
    
    throw new Error('AI service temporarily unavailable. Please try again later.');
  }
}
