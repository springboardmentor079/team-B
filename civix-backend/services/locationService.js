const User = require('../models/User');

// Mock geocoding service - in production, integrate with Google Maps, MapBox, etc.
const geocodingService = {
  async geocodeAddress(address) {
    // This is a mock implementation
    // In production, you would call an actual geocoding API
    const mockCoordinates = {
      'New York, NY': { latitude: 40.7128, longitude: -74.0060 },
      'Los Angeles, CA': { latitude: 34.0522, longitude: -118.2437 },
      'Chicago, IL': { latitude: 41.8781, longitude: -87.6298 },
      'Houston, TX': { latitude: 29.7604, longitude: -95.3698 },
      'Phoenix, AZ': { latitude: 33.4484, longitude: -112.0740 }
    };

    // Simple mock matching
    for (const [mockAddress, coords] of Object.entries(mockCoordinates)) {
      if (address.toLowerCase().includes(mockAddress.toLowerCase().split(',')[0])) {
        return {
          coordinates: coords,
          formattedAddress: mockAddress,
          success: true
        };
      }
    }

    // Default coordinates for unknown addresses
    return {
      coordinates: { latitude: 39.8283, longitude: -98.5795 }, // Geographic center of US
      formattedAddress: address,
      success: false,
      message: 'Address not found in geocoding service'
    };
  },

  async reverseGeocode(latitude, longitude) {
    // Mock reverse geocoding
    return {
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: 'Unknown City',
      state: 'Unknown State',
      success: true
    };
  }
};

// Mock civic jurisdiction service
const jurisdictionService = {
  async getJurisdictionFromCoordinates(latitude, longitude) {
    // This is a mock implementation
    // In production, you would query a civic boundaries database or API
    
    // Simple mock based on rough US regions
    if (latitude >= 40 && longitude <= -74) {
      return {
        city: 'New York',
        state: 'NY',
        district: 'Manhattan',
        county: 'New York County',
        zipCode: '10001'
      };
    } else if (latitude >= 34 && longitude <= -118) {
      return {
        city: 'Los Angeles',
        state: 'CA',
        district: 'Downtown',
        county: 'Los Angeles County',
        zipCode: '90001'
      };
    } else if (latitude >= 41 && longitude <= -87) {
      return {
        city: 'Chicago',
        state: 'IL',
        district: 'Loop',
        county: 'Cook County',
        zipCode: '60601'
      };
    } else {
      return {
        city: 'Unknown City',
        state: 'Unknown State',
        district: 'Unknown District',
        county: 'Unknown County',
        zipCode: 'Unknown'
      };
    }
  }
};

class LocationService {
  /**
   * Validate and geocode address
   * @param {string} address - Address string
   * @returns {Object} - Geocoding result with coordinates and jurisdiction
   */
  async validateAndGeocodeAddress(address) {
    try {
      if (!address || typeof address !== 'string' || address.trim().length === 0) {
        throw new Error('Valid address is required');
      }

      const trimmedAddress = address.trim();
      
      // Basic address format validation
      if (trimmedAddress.length < 5) {
        throw new Error('Address is too short');
      }

      // Geocode the address
      const geocodeResult = await geocodingService.geocodeAddress(trimmedAddress);
      
      if (!geocodeResult.success) {
        return {
          success: false,
          message: geocodeResult.message || 'Failed to geocode address',
          address: trimmedAddress
        };
      }

      // Get civic jurisdiction
      const jurisdiction = await jurisdictionService.getJurisdictionFromCoordinates(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude
      );

      return {
        success: true,
        address: geocodeResult.formattedAddress,
        coordinates: geocodeResult.coordinates,
        jurisdiction: jurisdiction
      };

    } catch (error) {
      throw new Error(`Address validation failed: ${error.message}`);
    }
  }

  /**
   * Update user location
   * @param {string} userId - User ID
   * @param {Object} locationData - Location data (address or coordinates)
   * @returns {Object} - Updated location information
   */
  async updateUserLocation(userId, locationData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let locationResult;

      if (locationData.address) {
        // Geocode address
        locationResult = await this.validateAndGeocodeAddress(locationData.address);
        if (!locationResult.success) {
          throw new Error(locationResult.message);
        }
      } else if (locationData.coordinates) {
        // Use provided coordinates and reverse geocode
        const { latitude, longitude } = locationData.coordinates;
        
        if (!this.isValidCoordinate(latitude, longitude)) {
          throw new Error('Invalid coordinates provided');
        }

        const reverseResult = await geocodingService.reverseGeocode(latitude, longitude);
        const jurisdiction = await jurisdictionService.getJurisdictionFromCoordinates(latitude, longitude);

        locationResult = {
          success: true,
          address: reverseResult.address,
          coordinates: { latitude, longitude },
          jurisdiction: jurisdiction
        };
      } else {
        throw new Error('Either address or coordinates must be provided');
      }

      // Update user location
      user.location = {
        address: locationResult.address,
        coordinates: locationResult.coordinates,
        jurisdiction: locationResult.jurisdiction
      };

      await user.save();

      return {
        message: 'Location updated successfully',
        location: user.location
      };

    } catch (error) {
      throw new Error(`Location update failed: ${error.message}`);
    }
  }

  /**
   * Get civic jurisdiction for coordinates
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Object} - Jurisdiction information
   */
  async getJurisdictionFromCoordinates(latitude, longitude) {
    try {
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new Error('Invalid coordinates provided');
      }

      const jurisdiction = await jurisdictionService.getJurisdictionFromCoordinates(latitude, longitude);
      
      return {
        success: true,
        jurisdiction: jurisdiction,
        coordinates: { latitude, longitude }
      };

    } catch (error) {
      throw new Error(`Jurisdiction lookup failed: ${error.message}`);
    }
  }

  /**
   * Find users in same jurisdiction
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of users to return
   * @returns {Array} - Array of users in same jurisdiction
   */
  async findUsersInSameJurisdiction(userId, limit = 50) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.location || !user.location.jurisdiction) {
        throw new Error('User not found or location not set');
      }

      const { city, state } = user.location.jurisdiction;
      
      const users = await User.find({
        _id: { $ne: userId }, // Exclude the requesting user
        'location.jurisdiction.city': city,
        'location.jurisdiction.state': state
      })
      .select('name email role verificationStatus location.jurisdiction')
      .limit(limit);

      return users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        verificationStatus: u.verificationStatus,
        jurisdiction: u.location.jurisdiction
      }));

    } catch (error) {
      throw new Error(`Failed to find users in jurisdiction: ${error.message}`);
    }
  }

  /**
   * Get location-based content (placeholder for civic content filtering)
   * @param {string} userId - User ID
   * @returns {Object} - Location-based content recommendations
   */
  async getLocationBasedContent(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.location || !user.location.jurisdiction) {
        return {
          message: 'Location not set - showing general content',
          content: []
        };
      }

      const { city, state, district } = user.location.jurisdiction;

      // This would integrate with petition, poll, and other civic content services
      return {
        message: `Content for ${city}, ${state}`,
        jurisdiction: { city, state, district },
        content: [
          // Placeholder content - would be populated by actual civic content services
          {
            type: 'petition',
            title: `Local petition for ${city}`,
            description: 'Sample petition content'
          },
          {
            type: 'poll',
            title: `${state} state poll`,
            description: 'Sample poll content'
          }
        ]
      };

    } catch (error) {
      throw new Error(`Failed to get location-based content: ${error.message}`);
    }
  }

  /**
   * Validate coordinate values
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {boolean} - Whether coordinates are valid
   */
  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {Object} coord1 - First coordinate {latitude, longitude}
   * @param {Object} coord2 - Second coordinate {latitude, longitude}
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number} - Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  /**
   * Get location statistics for admin dashboard
   * @returns {Object} - Location statistics
   */
  async getLocationStatistics() {
    try {
      const stats = await User.aggregate([
        {
          $match: { 'location.jurisdiction.state': { $exists: true } }
        },
        {
          $group: {
            _id: '$location.jurisdiction.state',
            count: { $sum: 1 },
            cities: { $addToSet: '$location.jurisdiction.city' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const totalUsersWithLocation = await User.countDocuments({ 'location.jurisdiction': { $exists: true } });
      const totalUsers = await User.countDocuments();

      return {
        totalUsers: totalUsers,
        usersWithLocation: totalUsersWithLocation,
        usersWithoutLocation: totalUsers - totalUsersWithLocation,
        locationCoverage: totalUsers > 0 ? (totalUsersWithLocation / totalUsers * 100).toFixed(2) : 0,
        stateDistribution: stats.map(stat => ({
          state: stat._id,
          userCount: stat.count,
          cityCount: stat.cities.length,
          cities: stat.cities
        }))
      };

    } catch (error) {
      throw new Error(`Failed to get location statistics: ${error.message}`);
    }
  }
}

module.exports = new LocationService();