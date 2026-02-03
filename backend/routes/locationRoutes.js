const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireVerifiedOfficial } = require('../middleware/roleMiddleware');

/**
 * Update user location
 */
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { address, coordinates } = req.body;

    if (!address && !coordinates) {
      return res.status(400).json({ 
        message: 'Either address or coordinates must be provided' 
      });
    }

    if (coordinates) {
      const { latitude, longitude } = coordinates;
      if (!locationService.isValidCoordinate(latitude, longitude)) {
        return res.status(400).json({ 
          message: 'Invalid coordinates provided' 
        });
      }
    }

    const locationData = {};
    if (address) locationData.address = address;
    if (coordinates) locationData.coordinates = coordinates;

    const result = await locationService.updateUserLocation(req.user.id, locationData);
    res.json(result);

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Validate and geocode address
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }

    const result = await locationService.validateAndGeocodeAddress(address);
    res.json(result);

  } catch (error) {
    console.error('Address validation error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get jurisdiction from coordinates
 */
router.post('/jurisdiction', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ 
        message: 'Valid latitude and longitude are required' 
      });
    }

    const result = await locationService.getJurisdictionFromCoordinates(latitude, longitude);
    res.json(result);

  } catch (error) {
    console.error('Jurisdiction lookup error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Find users in same jurisdiction
 */
router.get('/users/same-jurisdiction', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ 
        message: 'Limit must be a number between 1 and 100' 
      });
    }

    const result = await locationService.findUsersInSameJurisdiction(req.user.id, limitNum);
    res.json(result);

  } catch (error) {
    console.error('Find users in jurisdiction error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get location-based content
 */
router.get('/content', authenticateToken, async (req, res) => {
  try {
    const result = await locationService.getLocationBasedContent(req.user.id);
    res.json(result);

  } catch (error) {
    console.error('Get location content error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get location statistics (for admin dashboard)
 */
router.get('/statistics', authenticateToken, requireVerifiedOfficial, async (req, res) => {
  try {
    const result = await locationService.getLocationStatistics();
    res.json(result);

  } catch (error) {
    console.error('Get location statistics error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Calculate distance between two coordinates
 */
router.post('/distance', authenticateToken, async (req, res) => {
  try {
    const { coord1, coord2 } = req.body;

    if (!coord1 || !coord2) {
      return res.status(400).json({ 
        message: 'Two coordinate objects are required' 
      });
    }

    const { latitude: lat1, longitude: lon1 } = coord1;
    const { latitude: lat2, longitude: lon2 } = coord2;

    if (!locationService.isValidCoordinate(lat1, lon1) || 
        !locationService.isValidCoordinate(lat2, lon2)) {
      return res.status(400).json({ 
        message: 'Invalid coordinates provided' 
      });
    }

    const distance = locationService.calculateDistance(coord1, coord2);
    
    res.json({
      distance: distance,
      unit: 'kilometers',
      coordinates: {
        from: coord1,
        to: coord2
      }
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;