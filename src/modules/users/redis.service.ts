import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { generate } from 'otp-generator';
@Injectable()
export class RedisService {
  redis: Redis;

  constructor() {
    this.redis = new Redis({
      port: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
    });
  }
  async setOtp(phone_number: string, otp: string, ttl = 60) {
    await this.redis.setex(`user:${phone_number}`, ttl, otp);
  }
  async getOtp(key: string) {
    return await this.redis.get(key);
  }

  async getKey(key: string) {
    return await this.redis.get(key);
  }

  async isExistsKey(key: string) {
    return await this.redis.exists(key);
  }

  async getKeyTTL(key: string) {
    return this.redis.ttl(key);
  }

  async setTempUser(user: {
    role: string;
    phoneNumber: string;
    password: string;
    fullName: string;
    email: string;
  }) {
    await this.redis.setex(
      `temp_user:${user.phoneNumber}`,
      100,
      JSON.stringify(user),
    );
  }

  async setIncrKey(key: string) {
    return this.redis.incr(key);
  }

  async setExpireKey(key: string, ttl: number) {
    this.redis.expire(key, ttl);
  }

  async setIncrementKey(phone_number: string) {
    await this.redis.incr(`attempts_user:${phone_number}`);
    await this.redis.expire(`attempts_user:${phone_number}`, 50);
  }

  async delOtp(phone_number: string) {
    await this.redis.del(`user:${phone_number}`);
  }

  async delTempUser(key: string) {
    await this.redis.del(`temp_user:${key}`);
  }

  async delKey(key: string) {
    await this.redis.del(key);
  }

  generateOtpPassword() {
    const password = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });
    return password;
  }
  async sendEmailVerificationCode(email: string) {
    const randomUuid = crypto.randomUUID();
    const emailTokenKey = `email-tokens:${email}`;
    const verificationKey = `verification-email:${randomUuid}`;
    const code = this.generateOtpPassword();
    const getOldToken = await this.redis.get(emailTokenKey);
    if (getOldToken) {
      await this.redis.del(`verification-email:${getOldToken}`);
    }
    await this.redis.setex(
      verificationKey,
      3600,
      JSON.stringify({ email, code: code }),
    );
    await this.redis.setex(emailTokenKey, 3600, randomUuid);
    const link = `http://localhost:3000/api/users/verify/email?token=${randomUuid}`;
    return link;
  }
}
