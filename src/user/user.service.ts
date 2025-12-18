import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ChatwoUser } from '../entities/user.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { NakamaService } from 'src/nakama/nakama.service';
import { ChatwoItem } from 'src/entities/item.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(ChatwoUser)
    private readonly userRepository: Repository<ChatwoUser>,
    private readonly dataSource: DataSource,
    private readonly nakamaService: NakamaService,
  ) { }

  async findByNakamaId(nakamaId: string): Promise<ChatwoUser> {
    const user = await this.userRepository.findOne({
      where: { nakamaId }
    });

    if (!user) {
      throw new NotFoundException(`User with nakamaId ${nakamaId} not found`);
    }

    return user;
  }
}
