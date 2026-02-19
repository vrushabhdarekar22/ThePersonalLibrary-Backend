import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { Role } from './role.enum';
import { RegisterDto } from './dto/register.dto';


@Injectable()
export class AuthService implements OnModuleInit {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) { }

  // Seed admin & manager
  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const adminExists = await this.userModel.findOne({
      email: 'admin@test.com',
    });

    if (!adminExists) {
      await this.userModel.create({
        fullName: 'Admin User',
        email: 'admin@test.com',
        password: await bcrypt.hash('admin123', 10),
        role: Role.ADMIN,
      });
    }
    
    const managerExists = await this.userModel.findOne({
      email: 'manager@test.com',
    });
    
    if (!managerExists) {
      await this.userModel.create({
        fullName: 'Manager User',
        email: 'manager@test.com',
        password: await bcrypt.hash('manager123', 10),
        role: Role.MANAGER,
      });
    }

  }

  async register(registerDto: RegisterDto) {
    const { fullName, email, password } = registerDto;

    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);

    await this.userModel.create({
      fullName,
      email,
      password: hashed,
      role: Role.USER,
    });

    return { message: 'User registered successfully' };
  }


  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }
}
