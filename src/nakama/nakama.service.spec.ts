import { Test, TestingModule } from '@nestjs/testing';
import { NakamaService } from './nakama.service';

describe('NakamaService', () => {
  let service: NakamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NakamaService],
    }).compile();

    service = module.get<NakamaService>(NakamaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
