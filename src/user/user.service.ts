import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatwoUser } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChatwoLog } from 'src/entities/log.entity';
import { NakamaService } from 'src/nakama/nakama.service';
import { ChatwoItem } from 'src/entities/item.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(ChatwoUser)
    private readonly userRepository: Repository<ChatwoUser>,
    @InjectRepository(ChatwoLog)
    private readonly logRepository: Repository<ChatwoLog>,
    @InjectRepository(ChatwoItem)
    private readonly itemRepository: Repository<ChatwoItem>,
    private readonly dataSource: DataSource,
    private readonly nakamaService: NakamaService,
  ) { }

  async findAll(): Promise<ChatwoUser[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByNakamaId(nakamaId: string): Promise<ChatwoUser> {
    const user = await this.userRepository.findOne({
      where: { nakamaId },
      relations: {
        items: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with nakamaId ${nakamaId} not found`);
    }

    return user;
  }

  async findByOculusId(oculusId: string): Promise<ChatwoUser> {

    const user = await this.userRepository.findOne({
      where: { oculusId },
      relations: {
        items: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with oculusId ${oculusId} not found`);
    }

    return user;
  }

  async findByName(name: string): Promise<ChatwoUser> {
    const user = await this.userRepository.findOne({
      where: { name },
      relations: {
        items: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with name ${name} not found`);
    }

    return user;
  }

  async remove(nakamaId: string): Promise<void> {
    const user = await this.findByNakamaId(nakamaId); // Verify user exists
    if (!user) {
      throw new NotFoundException(`User with nakamaId ${nakamaId} not found`);
    }
    await this.userRepository.delete(user);
  }

  async update(
    nakamaId: string,
    updateDto: UpdateUserDto,
  ): Promise<ChatwoUser> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await this.findByNakamaId(nakamaId);
      if (!user) {
        throw new NotFoundException(`User with nakamaId ${nakamaId} not found`);
      }
      if (updateDto.oculusId !== undefined) {
        user.oculusId = updateDto.oculusId;
      }
      if (updateDto.name !== undefined) {
        user.name = updateDto.name;
      }
      if (updateDto.wallet !== undefined) {
        for (const [key, value] of Object.entries(updateDto.wallet)) {
          user.wallet[key] += value;
        }
        const log = this.logRepository.create({
          message: `User wallet updated: ${updateDto.reason}`,
          about: [user.nakamaId, 'wallet', 'user/update'],
          data: {
            wallet: updateDto.wallet,
          },
        });
        await queryRunner.manager.save(log);
      }
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }
  }

  async syncFromNakama(nakamaId: string): Promise<ChatwoUser> {
    const user = await this.userRepository.findOne({
      where: { nakamaId },
      relations: {
        items: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with nakamaId ${nakamaId} not found`);
    }

    const session = await this.nakamaService.login(nakamaId);
    const nakamaItems = await this.nakamaService.listItems(session);

    const itmesNeedToSave: ChatwoItem[] = [];

    user.name = (await this.nakamaService.getAccount(session)).user?.username || user.name;

    for (const nakamaItem of nakamaItems) {
      const item = user.items.find((item) => item.nakamaId === nakamaItem.nakamaId) ?? this.itemRepository.create({
        ...nakamaItem,
        owner: user,
      });
      item.key = nakamaItem.key!;
      item.type = nakamaItem.type!;
      item.meta = nakamaItem.meta;
      itmesNeedToSave.push(item);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(itmesNeedToSave);
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }
  }
}
