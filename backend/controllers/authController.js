import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dns from 'dns';
import util from 'util';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import cloudinary from '../config/cloudinary.js';
import sendEmail from '../utils/sendEmail.js';
import { getEmailTemplate } from '../utils/emailTemplate.js';

const resolveMx = util.promisify(dns.resolveMx);

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'yopmail.com', 'guerrillamail.com'
];

const checkEmailDomain = async (email) => {
  const domain = email.split('@')[1];
  if (!domain) return false;

  if (DISPOSABLE_DOMAINS.includes(domain.toLowerCase())) {
    throw new Error('Disposable email addresses are not allowed');
  }

  const addresses = await resolveMx(domain);
  if (!addresses || addresses.length === 0) {
    throw new Error('Invalid email domain');
  }
};

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

export const register = async (req, res, next) => {
  try {
    const { email: rawEmail, username, password, name, phone } = req.body;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });
    const email = rawEmail.toLowerCase().trim();

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'Email already exists' });

    user = await User.findOne({ username });
    if (user) return res.status(400).json({ error: 'Username already taken' });

    const pending = await PendingUser.findOne({ email });
    if (pending) await PendingUser.deleteOne({ email });
    
    const pendingUsername = await PendingUser.findOne({ username });
    if (pendingUsername) await PendingUser.deleteOne({ username });

    let avatarUrl = '';
    if (req.file) {
      try {
        avatarUrl = await uploadToCloudinary(req.file.buffer);
      } catch (err) {
        console.error('Avatar upload failed:', err);
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const pendingUser = new PendingUser({
      email,
      username,
      password,
      name,
      phone,
      avatar: avatarUrl,
      otpCode: otpHash
    });

    await pendingUser.save();

    await sendEmail(
      pendingUser.email,
      "Verify Your Email - BeatChat",
      getEmailTemplate("Verify Your Email", otp),
      `Your verification code is: ${otp}\n\nThis code expires in 15 minutes.`
    );

    res.json({
      message: 'Registration successful! Please check your email.',
      email: pendingUser.email
    });

  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email: rawEmail, otp } = req.body;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });
    const email = rawEmail.toLowerCase().trim();

    let user = await User.findOne({ email });
    let pendingUser = await PendingUser.findOne({ email });

    if (!user && !pendingUser) return res.status(404).json({ error: 'Registration session expired or user not found. Please register again.' });

    const target = pendingUser || user;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // For legacy users stored in User table, check expiration
    if (user && target.otpExpires < Date.now()) {
        return res.status(400).json({ error: 'Expired OTP' });
    }

    if (!target.otpCode || target.otpCode !== hashedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (pendingUser) {
        const newUserObj = {
            email: pendingUser.email,
            username: pendingUser.username,
            password: pendingUser.password, // Already securely hashed in PendingUser.js hook
            name: pendingUser.name,
            phone: pendingUser.phone,
            avatar: pendingUser.avatar,
            isVerified: true
        };
        // Use updateOne upsert to bypass User.js pre('save') hash
        await User.updateOne({ email: pendingUser.email }, { $set: newUserObj }, { upsert: true });
        await PendingUser.deleteOne({ email: pendingUser.email });
        user = await User.findOne({ email: pendingUser.email });
    } else {
        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });

  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier: rawIdentifier, password } = req.body;
    if (!rawIdentifier) return res.status(400).json({ error: 'Email or Username is required' });
    const identifier = rawIdentifier.toLowerCase().trim();

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
      user.otpExpires = Date.now() + 10 * 60 * 1000;

      await user.save();

      await sendEmail(
        user.email,
        "Verify Your Email - BeatChat",
        getEmailTemplate("Verify Your Email", otp),
        `Your verification code is: ${otp}`
      );

      return res.status(403).json({
        error: 'Account not verified. OTP sent again.',
        email: user.email
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });

  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });
    const email = rawEmail.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail(
      user.email,
      "Password Reset Verification - BeatChat",
      getEmailTemplate("Reset Your Password", otp),
      `Your password reset code is: ${otp}`
    );

    res.json({ message: 'OTP sent to email' });

  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email: rawEmail, otp } = req.body;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });
    const email = rawEmail.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (!user.otpCode || user.otpCode !== hashedOtp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const resetToken = jwt.sign(
      { id: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    user.otpCode = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ resetToken });

  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    next(err);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });
    const email = rawEmail.toLowerCase().trim();

    const user = await User.findOne({ email });
    const pendingUser = await PendingUser.findOne({ email });

    if (!user && !pendingUser) return res.status(404).json({ error: 'User not found' });

    const targetUser = pendingUser || user;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    targetUser.otpCode = otpHash;
    if (user) {
        targetUser.otpExpires = Date.now() + 10 * 60 * 1000;
    }
    
    await targetUser.save();

    await sendEmail(
      targetUser.email,
      "Your New Verification Code - BeatChat",
      getEmailTemplate("New Verification Code", otp),
      `Your new verification code is: ${otp}\n\nThis code expires in 15 minutes.`
    );

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, username, phone, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username && username.toLowerCase().trim() !== user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
      if (existingUser) return res.status(400).json({ error: 'Username already taken' });
      user.username = username.toLowerCase().trim();
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (email && email.toLowerCase().trim() !== user.email) {
      const newEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) return res.status(400).json({ error: 'Email already in use' });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      user.pendingEmail = newEmail;
      user.pendingEmailCode = otpHash;
      user.otpExpires = Date.now() + 15 * 60 * 1000;

      await user.save();

      await sendEmail(
        newEmail,
        "Verify Your New Email - BeatChat",
        getEmailTemplate("Verify Your New Email", otp),
        `Your verification code is: ${otp}\n\nThis code expires in 15 minutes.`
      );

      return res.json({ 
        message: 'Please verify your new email address.', 
        emailUpdatePending: true, 
        user 
      });
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });

  } catch (err) {
    next(err);
  }
};

export const verifyEmailChange = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.pendingEmail || !user.pendingEmailCode) {
      return res.status(400).json({ error: 'No pending email change request found' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.pendingEmailCode !== hashedOtp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired Verification Code' });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.pendingEmailCode = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: 'Email updated successfully', user });

  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const avatarUrl = await uploadToCloudinary(req.file.buffer);
    
    user.avatar = avatarUrl;
    await user.save();

    res.json({ message: 'Avatar updated successfully', avatar: avatarUrl, user });

  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!(await user.comparePassword(oldPassword))) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    user.password = newPassword; 
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (err) {
    next(err);
  }
};

export const deactivateAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    user.isDeactivated = true;
    await user.save();

    res.json({ message: 'Account deactivated successfully. You can restore it by logging in again.' });

  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account permanently deleted' });

  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  res.json({ message: 'Logged out successfully' });
};
