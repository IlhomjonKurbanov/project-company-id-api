import { Types } from 'mongoose';

export interface IUser<P = Types.ObjectId[], R = string> {
  _id: Types.ObjectId;
  email: string;
  name: string;
  lastName: string;
  role: string;
  dob: Date;
  evaluationDate: Date;
  startDate: Date;
  englishLevel: string;
  password?: string;
  github: string;
  initialLogin?: boolean;
  accessToken?: string;
  position: R;
  avatar: string;
  phone: string;
  skype: string;
  activeProjects?: P;
  projects?: P;
  isActive?: boolean;
  endDate?: Date;
  slack: string;
  post?: string;
  isShown?: boolean;
  vacationCount: number;
}
