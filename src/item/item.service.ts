import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatwoItem } from '../entities/item.entity';
import { ChatwoUser } from '../entities/user.entity';
import { configManager } from 'src/configV2/config';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(ChatwoItem)
    private readonly itemRepository: Repository<ChatwoItem>,
    @InjectRepository(ChatwoUser)
    private readonly userRepository: Repository<ChatwoUser>,
  ) { }

  async findOne(nakamaId: string, ownerCustomId: string): Promise<ChatwoItem> {
    const item = await this.itemRepository.findOne({
      where: {
        nakamaId,
        owner: {
          nakamaId: ownerCustomId,
        },
      },
    })
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  async initItemsForUser(user: ChatwoUser): Promise<ChatwoItem[]> {
    const items = await this.itemRepository.find({
      where: {
        owner: {
          nakamaId: user.nakamaId,
        },
      },
    });
    for (const itemConfig of configManager.items) {
      if (itemConfig.InitInStorage) {
        const hasItem = items.find(i => i.key === itemConfig.key);
        if (!hasItem) {
          const newItem = this.itemRepository.create({
            key: itemConfig.key,
            type: itemConfig.type,
            owner: user,
          });
          await this.itemRepository.save(newItem);
          items.push(newItem);
        }
      }
    }
    return items;
  }

  async findAllByCustomId(ownerCustomId: string): Promise<ChatwoItem[]> {
    const owner = await this.userRepository.findOne({
      where: { nakamaId: ownerCustomId },
    });
    if (!owner) {
      throw new NotFoundException(`User with nakamaId ${ownerCustomId} not found`);
    }
    return this.initItemsForUser(owner);
  }

  async findAllByOwner(ownerName: string): Promise<ChatwoItem[]> {
    const owner = await this.userRepository.findOne({
      where: { name: ownerName },
    });
    if (!owner) {
      throw new NotFoundException(`User with name ${ownerName} not found`);
    }
    return this.initItemsForUser(owner);
  }

  async findAll(): Promise<ChatwoItem[]> {
    return this.itemRepository.find();
  }

  async findAllWithDeleted(): Promise<ChatwoItem[]> {
    return this.itemRepository.find({
      withDeleted: true,
    });
  }

}
