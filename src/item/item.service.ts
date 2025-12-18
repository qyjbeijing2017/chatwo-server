import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatwoItem } from '../entities/item.entity';
import { ChatwoUser } from '../entities/user.entity';
import { configManager } from 'src/configV2/config';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { DropItemInDto } from './dto/drop-in.dto';
import { startTransaction } from 'src/utils/transaction';
import { ChatwoContainer, ContainerType } from 'src/entities/container.entity';

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

  async findAllInChest(account: ApiAccount): Promise<ChatwoItem[]> {
    const container = await this.containerRepository.findOne({
      where: {
        type: ContainerType.chest,
        owner: {
          nakamaId: account.custom_id || '',
        },
      },
      relations: {
        items: true,
      },
    })
    return container?.items || [];
  }

  async resetItemsForAccount(account: ApiAccount): Promise<void> {
  }

}
