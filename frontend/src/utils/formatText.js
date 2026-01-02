// Simple text formatting utility for AI responses
export const formatAIResponse = (text) => {
  if (!text) return '';
  
  return text
    // Convert **bold** to regular text (remove markdown)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Convert *italic* to regular text
    .replace(/\*(.*?)\*/g, '$1')
    // Ensure proper line breaks
    .replace(/\n\n/g, '\n\n')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
};

// Format text with better line breaks and spacing
export const formatTextDisplay = (text) => {
  if (!text) return '';
  
  return text
    // Remove markdown bold formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove markdown italic formatting  
    .replace(/\*(.*?)\*/g, '$1')
    // Ensure numbered lists have proper spacing
    .replace(/(\d+\.\s)/g, '\n\n$1')
    // Ensure bullet points have proper spacing
    .replace(/([•·-]\s)/g, '\n$1')
    // Add line breaks before new sections
    .replace(/([.!?])\s*(\d+\.)/g, '$1\n\n$2')
    // Clean up multiple line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
};