import { Schema, Types } from 'mongoose';

export const userSchema: Schema = new Schema({
  name: {
    required: true,
    type: String,
  },
  lastName: {
    required: true,
    type: String,
  },
  avatar: {
    required: true,
    type: String,
  },
  initialLogin: {
    required: true,
    type: Boolean,
    default: true,
  },
  dob: {
    required: true,
    type: Date,
  },
  email: {
    required: true,
    type: String,
    unique: true,
  },
  password: {
    required: true,
    type: String,
  },
  accessToken: {
    type: String,
    required: false,
  },
  englishLevel: {
    required: true,
    type: String,
  },
  github: {
    required: true,
    type: String,
  },
  slack: {
    required: false,
    type: String,
  },
  phone: {
    required: true,
    type: String,
    unique: true,
  },
  position: {
    required: true,
    type: String,
    default: 'developer',
  },
  role: {
    required: true,
    type: String,
    default: 'user',
  },
  skype: {
    required: true,
    type: String,
  },
  endDate: {
    required: false,
    type: Date,
  },
  startDate: {
    required: true,
    type: Date,
  },
  post: {
    required: false,
    type: String,
  },
  vacationCount: {
    required: true,
    type: Number,
  },
  evaluationDate: {
    required: true,
    type: Date,
  },
  salary: {
    type: Number,
  },
  isShown: {
    required: false,
    type: Boolean,
  },
  projects: { required: false, type: [Types.ObjectId], default: [] },
  activeProjects: {
    required: false,
    type: [Types.ObjectId],
    default: [],
  },
});
