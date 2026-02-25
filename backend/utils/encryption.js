const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

class EncryptionUtil {
  constructor() {
    // Use environment variable for encryption key or generate one
    this.encryptionKey = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
      : crypto.randomBytes(KEY_LENGTH);
  }

  /**
   * Encrypt sensitive data
   * @param {Buffer|string} data - Data to encrypt
   * @returns {Object} - Encrypted data with IV and auth tag
   */
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
      cipher.setAAD(Buffer.from('civix-verification', 'utf8'));
      
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const authTag = cipher.getAuthTag();
      
      return {
        encryptedData: encrypted,
        iv: iv,
        authTag: authTag
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   * @param {Object} encryptedObj - Object containing encrypted data, IV, and auth tag
   * @returns {Buffer} - Decrypted data
   */
  decrypt(encryptedObj) {
    try {
      const { encryptedData, iv, authTag } = encryptedObj;
      
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      decipher.setAAD(Buffer.from('civix-verification', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash sensitive text data (for passwords, tokens, etc.)
   * @param {string} data - Data to hash
   * @param {string} salt - Optional salt (will generate if not provided)
   * @returns {Object} - Hash and salt
   */
  hashData(data, salt = null) {
    try {
      const actualSalt = salt || crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
      
      return {
        hash: hash,
        salt: actualSalt
      };
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify hashed data
   * @param {string} data - Original data
   * @param {string} hash - Stored hash
   * @param {string} salt - Stored salt
   * @returns {boolean} - Whether data matches hash
   */
  verifyHash(data, hash, salt) {
    try {
      const { hash: newHash } = this.hashData(data, salt);
      return newHash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} - Hex encoded token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionUtil();
