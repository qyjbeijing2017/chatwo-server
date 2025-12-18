import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatwoItem } from '../entities/item.entity';
import { ChatwoUser } from '../entities/user.entity';
import { configManager } from 'src/configV2/config';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { DropItemInDto } from './dto/drop-in.dto';
import { ChatwoContainer, ContainerType } from 'src/entities/container.entity';
import { autoPatch } from 'src/utils/autoPatch';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(ChatwoItem)
    private readonly itemRepository: Repository<ChatwoItem>,
    @InjectRepository(ChatwoUser)
    private readonly userRepository: Repository<ChatwoUser>,
    @InjectRepository(ChatwoContainer)
    private readonly containerRepository: Repository<ChatwoContainer>,
    private readonly dataSource: DataSource,
  ) { }

  async getChestItems(account: ApiAccount): Promise<ChatwoItem[]> {
    const container = await this.containerRepository.findOne({
      where: {
        owner: { nakamaId: account.custom_id },
        type: ContainerType.chest,
      },
      relations: {
        items: true,
      },
    });
    return container?.items || [];
  }

  async dropItemIn(
    account: ApiAccount,
    nakamaId: string,
    dto: DropItemInDto,
  ): Promise<ChatwoItem> {
    return autoPatch<ChatwoItem>(this.dataSource, async (manager) => {
      const tags: string[] = ['item', 'drop-in', dto.key, nakamaId, account.custom_id!];

      const itemConfig = configManager.itemMap.get(dto.key);
      if (!itemConfig) {
        throw new NotFoundException(`Item config with key ${dto.key} not found`);
      }
      const user = await manager.findOne(ChatwoUser, {
        where: {
          nakamaId: account.custom_id,
        }
      });
      if (!user) {
        throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
      }

      let chest = await manager.findOne(ChatwoContainer, {
        where: {
          owner: { nakamaId },
          type: ContainerType.chest,
        }
      })

      if (!chest) {
        chest = manager.create(ChatwoContainer, {
          owner: user,
          type: ContainerType.chest,
        });
        await manager.save(chest);
      }

      const item = await manager.findOne(ChatwoItem, {
        where: {
          nakamaId,
        },
        relations: {
          owner: true,
          container: {
            owner: true,
          },
        }
      }) ?? await manager.create(ChatwoItem, {
        nakamaId,
        key: dto.key,
      });
      if (item.container) {
        throw new BadRequestException(`Item with nakamaId ${nakamaId} is already in a container`);
      }
      if (itemConfig.fromFile === "items.csv") {
        item.owner = user;
      } else {
        if (!item.owner) {
          throw new BadRequestException(`lock Item with nakamaId ${nakamaId} has no owner`);
        }
        if (item.owner.nakamaId !== account.custom_id) {
          item.owner = user;
          tags.push(item.owner.nakamaId!, 'change-owner');
        }
      }
      item.container = chest;
      await manager.save(item);

      return {
        result: item,
        message: `Dropped item ${nakamaId}(${dto.key}) into container ${nakamaId}`,
        tags,
      }
    });
  }
}
