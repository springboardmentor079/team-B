// Simple test controller
exports.getPetitions = async (req, res) => {
  try {
    res.json({ message: 'getPetitions working', petitions: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPetitionById = async (req, res) => {
  try {
    res.json({ message: 'getPetitionById working', petition: null });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPetition = async (req, res) => {
  try {
    res.json({ message: 'createPetition working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.signPetition = async (req, res) => {
  try {
    res.json({ message: 'signPetition working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserSignature = async (req, res) => {
  try {
    res.json({ message: 'getUserSignature working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePetition = async (req, res) => {
  try {
    res.json({ message: 'updatePetition working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePetition = async (req, res) => {
  try {
    res.json({ message: 'deletePetition working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPetitionSignatures = async (req, res) => {
  try {
    res.json({ message: 'getPetitionSignatures working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPetitionStats = async (req, res) => {
  try {
    res.json({ message: 'getPetitionStats working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};