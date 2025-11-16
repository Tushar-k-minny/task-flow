import { config } from '../config';
import prisma from '../database';
import { AppError } from '../middlewares/error.middleware';
import {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiry,
  verifyRefreshToken,
} from '../utils/jwt.utils';
import { comparePassword, hashPassword } from '../utils/password.utils';

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
        },
      });
      const accessToken = generateAccessToken({
        userId: newUser.id,
        email: newUser.email,
      });
      const refreshToken = generateRefreshToken({
        userId: newUser.id,
        email: newUser.email,
      });
      await tx.refreshToken.deleteMany({
        where: { userId: newUser.id, OR: [{ expiresAt: { lt: new Date() } }] },
      });
      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: newUser.id,
          expiresAt: getTokenExpiry(config.jwt.refreshExpiry),
        },
      });
      return { newUser, accessToken, refreshToken };
    });

    return {
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      user: {
        id: user.newUser.id,
        email: user.newUser.email,
        name: user.newUser.name,
      },
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    await this.clearRefreshTokens(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getTokenExpiry(config.jwt.refreshExpiry),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refresh(token: string): Promise<Omit<AuthResponse, 'user'>> {
    const payload = verifyRefreshToken(token);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
    });
    await prisma.$transaction([
      prisma.refreshToken.delete({
        where: { token },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.userId,
          expiresAt: getTokenExpiry(config.jwt.refreshExpiry),
        },
      }),
    ]);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async clearRefreshTokens(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lt: new Date() } }], //delete expired tokens
      },
    });
  }
}
