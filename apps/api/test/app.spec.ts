import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('AppModule', () => {
  it('compiles', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();

    await moduleRef.close();
  });
});
