import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  lastname: string;
  username: string;
  mail: string;
  password: string;
  accountType: 'student' | 'teacher' | 'admin';
  isA2FEnabled: boolean;
  a2fSecret?: string;
  subjects: string[];
  icon: string;
  notifications: string[];
  badges: string[];
  suspended?: {
    reason?: string;
    date?: Date;
  };
  experiments: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minLength: [2, 'Name must be at least 2 characters'],
    maxLength: [30, 'Name must be less than 30 characters'],
    trim: true,
  },
  lastname: {
    type: String,
    required: [true, 'Last name is required'],
    minLength: [2, 'Last name must be at least 2 characters'],
    maxLength: [30, 'Last name must be less than 30 characters'],
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minLength: [2, 'Username must be at least 2 characters'],
    maxLength: [25, 'Username must be less than 25 characters'],
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  },
  mail: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    minLength: [5, 'Email must be at least 5 characters'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  accountType: {
    type: String,
    required: [true, 'Account type is required'],
    enum: {
      values: ['student', 'teacher', 'admin'],
      message: 'Account type must be student, teacher, or admin',
    },
    default: 'student',
  },
  isA2FEnabled: {
    type: Boolean,
    default: false,
  },
  a2fSecret: {
    type: String,
    select: false, // Don't include in queries by default
  },
  subjects: {
    type: [String],
    default: [],
    enum: {
      values: [
        'mathematics', 'french', 'history', 'geography', 'physics', 
        'biology', 'philosophy', 'english', 'technology', 'snt', 
        'nsi', 'language', 'other'
      ],
      message: 'Invalid subject',
    },
  },
  icon: {
    type: String,
    default: 'defaultUser',
  },
  notifications: {
    type: [String],
    default: ['messageG', 'invitationC', 'commentP', 'experiments'],
    enum: {
      values: [
        'messageG', 'invitationC', 'commentP', 'experiments',
        'homework', 'flashcards', 'alumet', 'system'
      ],
      message: 'Invalid notification type',
    },
  },
  badges: {
    type: [String],
    default: [],
  },
  suspended: {
    reason: {
      type: String,
      maxLength: [500, 'Suspension reason must be less than 500 characters'],
    },
    date: {
      type: Date,
    },
  },
  experiments: {
    type: [String],
    default: [],
  },
  lastLogin: {
    type: Date,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.a2fSecret;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    },
  },
});

// Indexes for better performance
userSchema.index({ mail: 1 });
userSchema.index({ username: 1 });
userSchema.index({ accountType: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update lastLogin on successful authentication
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

export const User = mongoose.model<IUser>('User', userSchema);