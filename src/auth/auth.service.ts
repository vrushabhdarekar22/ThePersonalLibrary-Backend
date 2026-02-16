import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from './role.enum';

@Injectable()
export class AuthService implements OnModuleInit {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // This runs automatically when module starts
  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const adminExists = await this.userRepository.findOne({
      where: { email: 'admin@test.com' },
    });

    if (!adminExists) {
      const admin = this.userRepository.create({
        email: 'admin@test.com',
        password: await bcrypt.hash('admin123', 10),
        role: Role.ADMIN,
      });

      await this.userRepository.save(admin);
    }

    const managerExists = await this.userRepository.findOne({
      where: { email: 'manager@test.com' },
    });

    if (!managerExists) {
      const manager = this.userRepository.create({
        email: 'manager@test.com',
        password: await bcrypt.hash('manager123', 10),
        role: Role.MANAGER,
      });

      await this.userRepository.save(manager);
    }
  }

  async register(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password: hashed,
      role: Role.USER,
    });

    await this.userRepository.save(newUser);

    return { message: 'User registered successfully' };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}
