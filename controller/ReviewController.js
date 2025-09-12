const Review = require('../models/Review');
const Agent = require('../models/Agents');

exports.submitReview = async (req, res) => {
  try {
    const { rating, reviews, agentEmail } = req.body;

    if (!rating || !reviews || !Array.isArray(reviews) || reviews.length === 0 || !agentEmail) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    // Validate agent exists
    const agent = await Agent.findOne({ email: agentEmail });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    // Optional: calculate sentiment
    const positiveWords = ['good','great','excellent','happy','love','awesome','nice','fantastic','helpful','friendly','quick'];
    const negativeWords = ['bad','terrible','awful','hate','poor','disappointed','angry','frustrated','slow','scam','fraud','cheated'];

    const text = reviews.join(' ').toLowerCase();
    let sentiment = 'Neutral';
    const posCount = positiveWords.filter(word => text.includes(word)).length;
    const negCount = negativeWords.filter(word => text.includes(word)).length;
    if (negCount > posCount && negCount > 0) sentiment = 'Negative';
    else if (posCount > negCount && posCount > 0) sentiment = 'Positive';

    // ✅ Store both ObjectId and email
    const newReview = new Review({
      rating,
      reviews,
      sentiment,
      agent: agent._id,
      agentEmail: agent.email
    });

    await newReview.save();

    res.json({ success: true, message: 'Review saved successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
