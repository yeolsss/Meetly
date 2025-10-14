import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entiy/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    return await this.userRepository.find();
  }
  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('찾을 수 없는 유저 ID입니다.');
    }

    return user;
  }
  async create(createUserDto: CreateUserDto) {
    return await this.userRepository.save(createUserDto);
  }
  async update() {}
  async remove() {}
}
