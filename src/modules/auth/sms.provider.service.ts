import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
@Injectable()
export class SmsProviderService {
  private token: string;
  private getTokenApi: string = 'https://notify.eskiz.uz/api/auth/login';
  private sendSmsApi: string = 'https://notify.eskiz.uz/api/message/sms/send';
  private templateMessage: string = `StudyHub ilovasiga kirish kodi:`;
  constructor(private configService: ConfigService) {}
  async login() {
    const formData = new FormData();
    const eskiz_user = this.configService.get('ESKIZ_USER');
    const eskiz_password = this.configService.get('ESKIZ_PASSWORD');
    formData.set('email', eskiz_user);
    formData.set('password', eskiz_password);
    const response = await axios.post(this.getTokenApi, formData, {
      headers: {
        'content-type': 'multipart/form-data',
      },
    });
    const eskizToken = response.data.data.token;
    this.setToken(eskizToken);
  }
  setToken(token: string) {
    this.token = token;
  }
  async sendSms({ phone_number, otp }) {
    const formData = new FormData();
    const smsTemplate = this.templateMessage + `${otp}`;
    formData.set('mobile_phone', phone_number);
    formData.set('message', smsTemplate);
    formData.set('from', '4546');
    const response = await axios.post(this.sendSmsApi, formData, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.status;
  }
}
