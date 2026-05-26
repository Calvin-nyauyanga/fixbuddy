// ============================================
// CHATBOT AUTH MIDDLEWARE
// Location: server/src/middleware/chatbotAuth.js
// Purpose: Verify user authentication for chatbot
// ============================================

export const verifyChatbotUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Decode token (assuming you have a JWT setup)
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default { verifyChatbotUser };