const User = require('../models/User');
const { ROLES } = require('../config/roles');

exports.getUserProfile = async (req, reply) => {
  try {
    console.log('User dari request:', req.user); // Debugging

    if (!req.user || !req.user.id) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }

    let user = await User.findOne({ id: req.user.id });

    if (!user) {
      console.log('User belum ada di database, membuat user baru...');
      user = new User({
        id: req.user.id,
        name: req.user.username,
        role: req.user.role || ROLES.USER, // Gunakan default jika role undefined
        profile: {
          fullName: req.user.fullName || '',
          avatar: req.user.avatar || '',
          bio: '',
        },
      });

      await user.save();
      console.log('User berhasil dibuat:', user);
    }

    return reply.send({ message: 'Welcome to the Dashboard', user });
  } catch (error) {
    console.error('Error di getUserProfile:', error);
    reply.code(500).send({ message: 'Internal server error' });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, reply) => {
  try {
    if (!req.user || !req.user.id) {
      return reply
        .status(401)
        .send({ message: 'Unauthorized: Missing user ID' });
    }
    // console.log('Request Body:', req.body); // 🔍 Debug request body

    if (!req.body || typeof req.body !== 'object') {
      return reply.status(400).send({ message: 'Invalid request body' });
    }

    const { name, preferences } = req.body;

    if (!preferences) {
      return reply.status(400).send({ message: 'Preferences are required' });
    }
    const id = req.user.id;
    const updatedUser = await User.findOneAndUpdate(
      { id },
      { name, preferences },
      { new: true }
    );

    if (!updatedUser) {
      return reply.status(404).send({ message: 'User not found' });
    }

    reply.send({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error(error);
    reply.status(500).send({ message: 'Internal Server Error' });
  }
};
