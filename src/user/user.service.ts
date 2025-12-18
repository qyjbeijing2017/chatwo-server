import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
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
    await this.userRepository.softRemove(user);
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
          tags: [user.nakamaId, 'wallet', 'user/update'],
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

  async syncFromNakama(user: ChatwoUser, manager: EntityManager): Promise<void> {

    const session = await this.nakamaService.login(user.nakamaId);
    const nakamaItems = await this.nakamaService.listItems(session);

    const itmesNeedToSave: ChatwoItem[] = [];
    const itmesNeedToDelete: ChatwoItem[] = [];

    user.name = (await this.nakamaService.getAccount(session)).user?.username || user.name;

    const log = manager.create(ChatwoLog, {
      message: `User synced from Nakama`,
      about: [
        user.nakamaId,
        'user/syncFromNakama',
      ],
      data: {}
    });

    const wallet = await this.nakamaService.getWallet(session);

    for (const [key, value] of Object.entries(wallet)) {
      if (user.wallet[key] !== value) {
        log.data.wallet = log.data.wallet || {};
        log.data.wallet[key] = value - (user.wallet[key] || 0);
        user.wallet[key] = value;
      }
    }

    for (const nakamaItem of nakamaItems) {
      let item = user.items.find((item) => item.nakamaId === nakamaItem.nakamaId);
      if (!item) {
        item = manager.create(ChatwoItem, {
          ...nakamaItem,
          owner: user,
        });
        log.data.item = log.data.item || {};
        log.data.item.added = log.data.item.added || [];
        log.data.item.added.push({ ...nakamaItem });
      } else {
        log.data.item = log.data.item || {};
        log.data.item.update = log.data.item.update || {};
        log.data.item.update[item.nakamaId] = {
          metadata: {
            before: item.meta,
            after: nakamaItem.meta,
          },
        };
        item.owner = user;
        item.meta = nakamaItem.meta;
      }
      itmesNeedToSave.push(item);
      log.tags.push(nakamaItem.nakamaId!);
    }

    for (const item of user.items) {
      const nakamaItem = nakamaItems.find((ni) => ni.nakamaId === item.nakamaId);
      if (!nakamaItem) {
        itmesNeedToDelete.push(item);
      }
    }

    await manager.save(itmesNeedToSave);
    await manager.update(
      ChatwoUser,
      { id: user.id },
      {
        name: user.name,
        wallet: user.wallet,
      },
    );
    await manager.save(log);
  }

  async syncOneFromNakama(nakamaId: string) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await queryRunner.manager.findOne(ChatwoUser, {
        where: { nakamaId },
        relations: {
          items: true,
        },
      });
      if (!user) {
        throw new NotFoundException(`User with nakamaId ${nakamaId} not found`);
      }

      await this.syncFromNakama(user, queryRunner.manager);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return {
        ...user,
        items: user.items.map(item => ({
          id: item.id,
          nakamaId: item.nakamaId,
          meta: item.meta,
          key: item.key,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }
  }

  async syncAllFromNakama(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const users = await queryRunner.manager.find(ChatwoUser, {
        relations: {
          items: true,
        },
      });
      for (const user of users) {
        await this.syncFromNakama(user, queryRunner.manager);
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }
  }
}
