import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  status: 0 | 1 | 2 | 3 | 4; // 0-owner, 1-admin, 2-user, 3-banned, 4-requesting
  joinedAt: Date;
}

export interface ICustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface IAlumet extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  security: 'open' | 'onpassword' | 'closed';
  password?: string;
  subject: string;
  participants: IParticipant[];
  private: boolean;
  swiftchat: boolean;
  lastUsage: Date;
  font: string;
  background: string;
  customsLinks: ICustomLink[];
  type: 'alumet' | 'flashcard' | 'mindmap';
  discovery: boolean;
  createdAt: Date;
  updatedAt: Date;
  isUserParticipant(userId: string): boolean;
  getUserParticipant(userId: string): IParticipant | undefined;
  addParticipant(userId: string, status?: number): void;
  removeParticipant(userId: string): void;
  updateParticipantStatus(userId: string, status: number): void;
}

const participantSchema = new Schema<IParticipant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4],
    default: 2,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const customLinkSchema = new Schema<ICustomLink>({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxLength: [100, 'Link title must be less than 100 characters'],
  },
  url: {
    type: String,
    required: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
  },
  icon: {
    type: String,
  },
});

const alumetSchema = new Schema<IAlumet>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    minLength: [2, 'Title must be at least 2 characters'],
    maxLength: [150, 'Title must be less than 150 characters'],
    trim: true,
  },
  description: {
    type: String,
    maxLength: [2000, 'Description must be less than 2000 characters'],
    trim: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  security: {
    type: String,
    required: true,
    enum: {
      values: ['open', 'onpassword', 'closed'],
      message: 'Security must be open, onpassword, or closed',
    },
    default: 'open',
  },
  password: {
    type: String,
    maxLength: [50, 'Password must be less than 50 characters'],
    select: false, // Don't include password in queries by default
  },
  subject: {
    type: String,
    required: true,
    enum: {
      values: [
        'mathematics', 'french', 'history', 'geography', 'physics',
        'biology', 'philosophy', 'english', 'technology', 'snt',
        'nsi', 'language', 'other'
      ],
      message: 'Invalid subject',
    },
    default: 'other',
  },
  participants: {
    type: [participantSchema],
    default: [],
  },
  private: {
    type: Boolean,
    default: false,
  },
  swiftchat: {
    type: Boolean,
    default: true,
  },
  lastUsage: {
    type: Date,
    default: Date.now,
  },
  font: {
    type: String,
    default: 'pjs',
    enum: ['pjs', 'arial', 'helvetica', 'times', 'courier'],
  },
  background: {
    type: String,
    default: 'defaultAlumet',
  },
  customsLinks: {
    type: [customLinkSchema],
    default: [],
    validate: {
      validator: function(links: ICustomLink[]) {
        return links.length <= 10;
      },
      message: 'Cannot have more than 10 custom links',
    },
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: ['alumet', 'flashcard', 'mindmap'],
      message: 'Type must be alumet, flashcard, or mindmap',
    },
    default: 'alumet',
  },
  discovery: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    },
  },
});

// Indexes for better performance
alumetSchema.index({ owner: 1 });
alumetSchema.index({ 'participants.userId': 1 });
alumetSchema.index({ subject: 1 });
alumetSchema.index({ type: 1 });
alumetSchema.index({ discovery: 1, private: 1 });
alumetSchema.index({ lastUsage: -1 });
alumetSchema.index({ createdAt: -1 });

// Virtual for participant count
alumetSchema.virtual('participantCount').get(function() {
  return this.participants?.length || 0;
});

// Methods
alumetSchema.methods.isUserParticipant = function(userId: string): boolean {
  return this.participants.some((p: IParticipant) => 
    p.userId.toString() === userId && p.status !== 3 // Not banned
  );
};

alumetSchema.methods.getUserParticipant = function(userId: string): IParticipant | undefined {
  return this.participants.find((p: IParticipant) => 
    p.userId.toString() === userId
  );
};

alumetSchema.methods.addParticipant = function(userId: string, status: number = 2): void {
  // Remove existing participant if exists
  this.participants = this.participants.filter((p: IParticipant) => 
    p.userId.toString() !== userId
  );
  
  // Add new participant
  this.participants.push({
    userId: new mongoose.Types.ObjectId(userId),
    status,
    joinedAt: new Date(),
  });
};

alumetSchema.methods.removeParticipant = function(userId: string): void {
  this.participants = this.participants.filter((p: IParticipant) => 
    p.userId.toString() !== userId
  );
};

alumetSchema.methods.updateParticipantStatus = function(userId: string, status: number): void {
  const participant = this.participants.find((p: IParticipant) => 
    p.userId.toString() === userId
  );
  if (participant) {
    participant.status = status;
  }
};

// Pre-save middleware
alumetSchema.pre('save', function(next) {
  // Update lastUsage when document is modified
  if (this.isModified() && !this.isNew) {
    this.lastUsage = new Date();
  }
  
  // Ensure owner is always a participant with status 0
  if (this.isNew || this.isModified('owner')) {
    this.addParticipant(this.owner.toString(), 0);
  }
  
  next();
});

// Pre-validate middleware
alumetSchema.pre('validate', function(next) {
  // Require password for password-protected alumets
  if (this.security === 'onpassword' && !this.password) {
    next(new Error('Password is required for password-protected alumets'));
  } else {
    next();
  }
});

export const Alumet = mongoose.model<IAlumet>('Alumet', alumetSchema);