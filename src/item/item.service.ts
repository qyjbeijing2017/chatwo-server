import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { ChatwoItem, ItemType } from '../entities/item.entity';
import { ChatwoUser } from '../entities/user.entity';
import { configManager } from 'src/configV2/config';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { DropItemInDto } from './dto/drop-in.dto';
import { ChatwoContainer, ContainerType } from 'src/entities/container.entity';
import { autoPatch } from 'src/utils/autoPatch';
import { UpdateItemDto } from './dto/update-item.dto';

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

  async getContainer(manager: EntityManager, account: ApiAccount, type: ContainerType = ContainerType.chest, withItems: boolean = false): Promise<ChatwoContainer> {
    let container = await manager.findOne(ChatwoContainer, {
      where: {
        owner: { nakamaId: account.custom_id },
        type,
      },
      relations: withItems ? { items: true } : {},
    });
    if (!container) {
      const user = await this.userRepository.findOne({
        where: { nakamaId: account.custom_id },
      });
      if (!user) {
        throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
      }
      container = this.containerRepository.create({
        owner: user,
        type,
      });
      await this.containerRepository.save(container);
    }
    return container;
  }

  async gainItems(manager: EntityManager, account: ApiAccount, items: Record<string, number>) {
    const result: ChatwoItem[] = [];
    const user = await manager.findOne(ChatwoUser, {
      where: { nakamaId: account.custom_id },
    });
    if (!user) {
      throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
    }
    const chest = await this.getContainer(manager, account, ContainerType.chest);
    for (const key of Object.keys(items)) {
      const itemConfig = configManager.itemMap.get(key);
      if (!itemConfig) {
        throw new NotFoundException(`Item config with key ${key} not found`);
      }
      if ((itemConfig.type & ItemType.skin) !== 0) {
        const existingSkins = await manager.findOne(ChatwoItem, {
          where: {
            key,
            owner: { nakamaId: account.custom_id },
          },
        });
        if (existingSkins) {
          continue; // Skip adding duplicate skins
        }
        const item = manager.create(ChatwoItem, {
          key,
          owner: user,
          container: chest,
        });
        await manager.save(item);
        result.push(item);
      } else if (itemConfig.fromFile === 'items.csv') {
        result.push(manager.create(ChatwoItem, {
          key,
        }));
      } else {
        const item = manager.create(ChatwoItem, {
          key,
          owner: user,
        });
        await manager.save(item);
        result.push(item);
      }

    }
    return result;
  }

  async getChestItems(account: ApiAccount): Promise<ChatwoItem[]> {
    return this.itemRepository.find({
      where: {
        container: {
          type: ContainerType.chest,
          owner: { nakamaId: account.custom_id },
        },
      },
      order: {
        updatedAt: 'ASC',
      }
    });
  }

  async getEquippedItems(account: ApiAccount): Promise<ChatwoItem[]> {
    const containers = await this.containerRepository.find({
      where: {
        owner: { nakamaId: account.custom_id },
        type: Between(ContainerType.equipped_start, ContainerType.equipped_end),
      },
      relations: {
        items: true,
      },
    });
    const items: ChatwoItem[] = [];
    containers.forEach(c => {
      items[c.type - 1] = c.items[0];
    });
    return items;
  }

  async equipItem(
    account: ApiAccount,
    nakamaId: string,
    pointerIndex: number,
    dto: DropItemInDto,
  ): Promise<ChatwoItem> {
    return autoPatch<ChatwoItem>(this.dataSource, async (manager) => {
      const tags: string[] = ['item', 'equip', dto.key, nakamaId, account.custom_id!, `pointerIndex:${pointerIndex}`];
      if (pointerIndex < ContainerType.equipped_start || pointerIndex > ContainerType.equipped_end) {
        throw new BadRequestException(`pointerIndex ${pointerIndex} is out of range`);
      }
      const itemConfig = configManager.itemMap.get(dto.key);
      if (!itemConfig) {
        throw new NotFoundException(`Item config with key ${dto.key} not found`);
      }
      if ((itemConfig.type & ItemType.dropable) === 0) {
        throw new BadRequestException(`Item with key ${dto.key} is not dropable type`);
      }
      const user = await manager.findOne(ChatwoUser, {
        where: {
          nakamaId: account.custom_id,
        }
      });
      if (!user) {
        throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
      }

      let equipContainer = await this.getContainer(manager, account, pointerIndex, true);

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
        meta: dto.meta,
      });
      if (equipContainer?.items[0]) {
        throw new BadRequestException(`Item with nakamaId ${equipContainer.items[0].nakamaId} is already in a container`);
      }
      item.container = equipContainer;
      await manager.save(item);

      return {
        result: item,
        message: `Equipped item ${nakamaId}(${dto.key}) into container ${pointerIndex}`,
        tags,
      }
    });
  }

  async unequipItem(
    account: ApiAccount,
    pointerIndex: number,
  ): Promise<ChatwoItem> {
    return autoPatch<ChatwoItem>(this.dataSource, async (manager) => {
      const tags: string[] = ['item', 'unequip', account.custom_id!, `pointerIndex:${pointerIndex}`];
      if (pointerIndex < ContainerType.equipped_start || pointerIndex > ContainerType.equipped_end) {
        throw new BadRequestException(`pointerIndex ${pointerIndex} is out of range`);
      }
      const item = await manager.findOne(ChatwoItem, {
        where: {
          container: {
            type: pointerIndex,
            owner: { nakamaId: account.custom_id },
          },
        },
        relations: {
          owner: true,
          container: {
            owner: true,
          },
        }
      });
      if (!item) {
        throw new NotFoundException(`No item equipped in pointerIndex ${pointerIndex}`);
      }
      const itemConfig = configManager.itemMap.get(item.key);
      if (!itemConfig) {
        throw new NotFoundException(`Item config with key ${item.key} not found`);
      }
      if (itemConfig.fromFile === 'items.csv') {
        await manager.delete(ChatwoItem, item);
      } else {
        item.container = null;
        await manager.save(item);
      }

      return {
        result: item,
        message: `Unequipped item ${item.nakamaId}(${item.key}) from container ${pointerIndex}`,
        tags,
      }
    });
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
      if ((itemConfig.type & ItemType.dropable) === 0) {
        throw new BadRequestException(`Item with key ${dto.key} is not dropable type`);
      }
      const user = await manager.findOne(ChatwoUser, {
        where: {
          nakamaId: account.custom_id,
        }
      });
      if (!user) {
        throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
      }
      const chest = await this.getContainer(manager, account, ContainerType.chest);

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
        meta: dto.meta,
      });
      if (item.container) {
        throw new BadRequestException(`Item with nakamaId ${nakamaId} is already in a container`);
      }
      if (itemConfig.fromFile === 'items.csv') {
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

  async getContainers(account: ApiAccount): Promise<ChatwoContainer[]> {
    const containers = await this.containerRepository.find({
      where: {
        owner: { nakamaId: account.custom_id },
      },
      relations: {
        items: true,
      },
    });
    return containers;
  }

  async resetItems(
    account: ApiAccount,
  ): Promise<void> {
    return autoPatch<void>(this.dataSource, async (manager) => {
      const tags: string[] = ['item', 'reset', account.custom_id!];
      const ownerItems = await manager.find(ChatwoItem, {
        where: [
          {
            owner: { nakamaId: account.custom_id! },
            container: IsNull(),
          },
          {
            owner: { nakamaId: account.custom_id },
            container: {
              owner: { nakamaId: Not(account.custom_id!) },
            }
          }
        ],
      });
      if (ownerItems.length > 0) {
        const user = await manager.findOne(ChatwoUser, {
          where: {
            nakamaId: account.custom_id,
          }
        });
        if (!user) {
          throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
        }

        // let chest = await manager.findOne(ChatwoContainer, {
        //   where: {
        //     owner: { nakamaId: account.custom_id },
        //     type: ContainerType.chest,
        //   },
        // })
        // if (!chest) {
        //   chest = manager.create(ChatwoContainer, {
        //     owner: user,
        //     type: ContainerType.chest,
        //   });
        //   await manager.save(chest);
        // }
        const chest = await this.getContainer(manager, account, ContainerType.chest);
        for (const item of ownerItems) {
          item.container = chest;
          tags.push(item.nakamaId!);
        }
        await manager.save(ownerItems);
      }
      return {
        result: undefined,
        message: `Reset ${ownerItems.length} items to chest for user ${account.custom_id}`,
        tags,
      }
    });
  }

  async takeItemOut(
    account: ApiAccount,
    nakamaId: string,
  ): Promise<ChatwoItem> {
    return autoPatch<ChatwoItem>(this.dataSource, async (manager) => {
      const tags: string[] = ['item', 'take-out', nakamaId, account.custom_id!];
      const item = await manager.findOne(ChatwoItem, {
        where: {
          nakamaId,
          owner: { nakamaId: account.custom_id },
          container: { type: ContainerType.chest }
        },
        relations: {
          owner: true,
          container: {
            owner: true,
          },
        }
      });
      if (!item) {
        throw new NotFoundException(`Item with nakamaId ${nakamaId} not found`);
      }
      const itemConfig = configManager.itemMap.get(item.key);
      if (!itemConfig) {
        throw new NotFoundException(`Item config with key ${item.key} not found`);
      }
      if ((itemConfig.type & ItemType.dropable) === 0) {
        throw new BadRequestException(`Item with nakamaId ${nakamaId} is not dropable type`);
      }
      if (itemConfig.fromFile === 'items.csv') {
        manager.delete(ChatwoItem, item);
      } else {
        item.container = null;
        await manager.save(item);
      }
      return {
        result: item,
        message: `Took out item ${nakamaId}(${item.key}) from container`,
        tags,
      }
    });
  }

  async deleteContainer(
    account: ApiAccount,
    containerId: number,
  ): Promise<void> {
    const container = await this.containerRepository.findOne({
      where: {
        id: containerId,
        owner: { nakamaId: account.custom_id },
      },
      relations: {
        items: true,
      },
    });
    if (!container) {
      throw new NotFoundException(`Container with id ${containerId} not found`);
    }
    container.items.forEach((item) => {
      item.container = null;
    });
    await this.itemRepository.save(container.items);
    await this.containerRepository.remove(container);
  }

  async updateItem(
    account: ApiAccount,
    nakamaId: string,
    dto: UpdateItemDto,
  ): Promise<ChatwoItem> {
    return autoPatch<ChatwoItem>(this.dataSource, async (manager) => {
      const tags: string[] = ['item', 'update', nakamaId, account.custom_id!, ...dto.tags];
      const item = await manager.findOne(ChatwoItem, {
        where: {
          nakamaId,
        },
        relations: {
          owner: true,
        }
      });
      if (!item) {
        throw new NotFoundException(`Item with nakamaId ${nakamaId} not found`);
      }
      if(item.owner && item.owner.nakamaId !== account.custom_id) {
        throw new BadRequestException(`Item with nakamaId ${nakamaId} is not owned by user ${account.custom_id}`);
      }
      item.meta = dto.meta;
      await manager.save(item);
      return {
        result: item,
        message: `Updated item ${nakamaId}(${item.key})`,
        tags,
      }
    });
  }
}
