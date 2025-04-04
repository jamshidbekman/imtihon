import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
class SmsLimiterService {
  constructor(private redisService: RedisService) {}
  async sendSmsLimitChecking(phone_number: string) {
    try {
      const keyHourly = `sms-limit-hourly:${phone_number}`;
      const hourly = await this.redisService.isExistsKey(keyHourly);
      if (hourly) {
        const count = await this.redisService.getKey(keyHourly);
        if (Number(count) >= 20) {
          throw new HttpException(
            'sizda soatlik limit tugadi!!',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
      const key = `sms-cooldown-seconds:${phone_number}`;
      const cooldownSecond = await this.redisService.isExistsKey(key);
      if (cooldownSecond) {
        const ttl = await this.redisService.getKeyTTL(key);
        throw new HttpException(
          `Iltimos ${ttl} soniyadan keyin qayta urinib ko'ring`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {}
  }
  async trackSmsRequest(phone_number: string) {
    const keyCooldown = `sms-cooldown-seconds:${phone_number}`;
    const cooldown = await this.redisService.setIncrKey(keyCooldown);
    if (cooldown === 1) {
      this.redisService.setExpireKey(keyCooldown, 60);
    }
    const keyHourly = `sms-limit-hourly:${phone_number}`;
    const hourly = await this.redisService.setIncrKey(keyHourly);
    if (hourly === 1) {
      this.redisService.setExpireKey(keyHourly, 3600);
    }
    const keyDaily = `sms-limit-daily:${phone_number}`;
    const daily = await this.redisService.setIncrKey(keyDaily);
    if (daily === 1) {
      this.redisService.setExpireKey(keyDaily, 86400);
    }
  }
}
export default SmsLimiterService;
