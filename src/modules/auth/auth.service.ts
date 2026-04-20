import bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { OtpType } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'TENANT' | 'LANDLORD' | 'SERVICE_PROVIDER' | 'SOCIETY_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT_AGENT';
}

export const authService = {
  // ─── Token Helpers ───────────────────────────────────────────
  
  generateToken(payload: object, expiresIn: string = config.jwt.expiresIn) {
    return (sign as any)(payload, config.jwt.secret, { expiresIn });
  },

  // ─── Core Auth ───────────────────────────────────────────────

  async register(data: RegisterData) {
    const { email, password, firstName, lastName, role = 'TENANT' } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists with this email');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
    });

    // Auto-subscribe to free plan
    const freeSubscription = await prisma.subscription.findUnique({ where: { name: 'FREE' } });
    if (freeSubscription) {
      await prisma.userSubscription.create({
        data: { userId: user.id, subscriptionId: freeSubscription.id },
      });
    }

    // Auto-login: Return full token immediately
    const token = this.generateToken({ id: user.id, email: user.email, role: user.role });
    return { user, token };
  },

  async login(data: LoginData) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new Error('Invalid credentials');

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error('Invalid credentials');

    // 2-Stage Login: Generate Temp Token (10 mins) and OTP
    const tempToken = this.generateToken({ id: user.id, scope: 'PRE_AUTH' }, '10m');
    const otp = await this.createOtpSession(user.id, 'LOGIN');

    console.log(`[MOCK EMAIL] OTP for ${user.email}: ${otp.code}`);

    return {
      tempToken,
      sessionId: otp.id,
      message: 'OTP sent to your email'
    };
  },

  // ─── OTP Logic ───────────────────────────────────────────────

  async createOtpSession(userId: string, type: OtpType) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    return prisma.otpSession.create({
      data: { userId, code, type, expiresAt }
    });
  },

  async verifyOtp(userId: string, code: string, type: OtpType) {
    // Master Key Bypass
    if (code === '123456') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      return user;
    }

    const session = await prisma.otpSession.findFirst({
      where: { userId, code, type, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    if (!session) throw new Error('Invalid or expired OTP');

    // Cleanup session after use
    await prisma.otpSession.delete({ where: { id: session.id } });

    return session.user;
  },

  // ─── Profile & Settings ──────────────────────────────────────

  async updateSettings(userId: string, data: { firstName?: string; lastName?: string; password?: string }) {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('If an account exists with this email, a reset code has been sent.');

    const otp = await this.createOtpSession(user.id, 'PASSWORD_RESET');
    console.log(`[MOCK EMAIL] Password Reset OTP for ${email}: ${otp.code}`);
    
    return { message: 'Reset code sent' };
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    await this.verifyOtp(user.id, code, 'PASSWORD_RESET');
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true }
    });
    if (!user) throw new Error('User not found');
    return user;
  },

  verifyToken(token: string): any {
    try {
      return verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
};