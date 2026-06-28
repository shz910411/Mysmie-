import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileInput, UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('me/profile')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  get(@CurrentUser() userId: number) {
    return this.users.getProfile(userId);
  }

  @Put()
  update(@CurrentUser() userId: number, @Body() body: ProfileInput) {
    return this.users.updateProfile(userId, body);
  }
}
