import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatwoItem } from '../entities/item.entity';
import { ChatwoUser } from '../entities/user.entity';

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

  async findAll(ownerCustomId: string): Promise<ChatwoItem[]> {
    return this.itemRepository.find({
      where: {
        owner: {
          nakamaId: ownerCustomId,
        },
      },
    });
  }

  async findAllByOwner(ownerName: string): Promise<ChatwoItem[]> {
    return this.itemRepository.find({
      where: {
        owner: {
          name: ownerName,
        },
      },
    });
  }
}
