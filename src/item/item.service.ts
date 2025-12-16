import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatwoItem } from '../entities/item.entity';
import { ChatwoUser } from '../entities/user.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(ChatwoItem)
    private readonly itemRepository: Repository<ChatwoItem>,
    @InjectRepository(ChatwoUser)
    private readonly userRepository: Repository<ChatwoUser>,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<ChatwoItem> {
    const owner = await this.userRepository.findOne({
      where: { nakamaId: createItemDto.userNakamaId },
    });

    if (!owner) {
      throw new NotFoundException(
        `User with ID ${createItemDto.userNakamaId} not found`,
      );
    }

    const item = this.itemRepository.create({
      key: createItemDto.key,
      type: createItemDto.type,
      owner,
    });

    return this.itemRepository.save(item);
  }

  async findAll(): Promise<ChatwoItem[]> {
    return this.itemRepository.find({ relations: ['owner'] });
  }

  async findOne(id: number): Promise<ChatwoItem> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  async update(id: number, updateItemDto: UpdateItemDto): Promise<ChatwoItem> {
    const item = await this.findOne(id);

    if (updateItemDto.ownerId) {
      const owner = await this.userRepository.findOne({
        where: { id: updateItemDto.ownerId },
      });

      if (!owner) {
        throw new NotFoundException(
          `User with ID ${updateItemDto.ownerId} not found`,
        );
      }

      item.owner = owner;
    }

    if (updateItemDto.key !== undefined) {
      item.key = updateItemDto.key;
    }

    if (updateItemDto.type !== undefined) {
      item.type = updateItemDto.type;
    }

    return this.itemRepository.save(item);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Verify item exists
    await this.itemRepository.softDelete(id);
  }

  async findByOwner(ownerId: number): Promise<ChatwoItem[]> {
    return this.itemRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
    });
  }
}
