const QueryHistory = require('../models/QueryHistory');

// @desc    Get user's query history
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const history = await QueryHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, count: history.length, history });
  } catch (error) {
    console.error('[History Controller Error - Get]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve history' });
  }
};

// @desc    Delete a query history entry
// @route   DELETE /api/history/:id
// @access  Private
const deleteHistoryItem = async (req, res) => {
  try {
    const item = await QueryHistory.findOne({
      _id: req.params.id,
      userId: req.user._id, // Ownership protection (prevents IDOR)
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'History item not found or unauthorized to delete',
      });
    }

    await item.deleteOne();
    res.json({ success: true, message: 'History item removed' });
  } catch (error) {
    console.error('[History Controller Error - Delete Item]', error);
    res.status(500).json({ success: false, message: 'Failed to delete history item' });
  }
};

// @desc    Clear entire user history
// @route   DELETE /api/history
// @access  Private
const clearHistory = async (req, res) => {
  try {
    await QueryHistory.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'All query history cleared' });
  } catch (error) {
    console.error('[History Controller Error - Clear]', error);
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
};

module.exports = {
  getHistory,
  deleteHistoryItem,
  clearHistory,
};
