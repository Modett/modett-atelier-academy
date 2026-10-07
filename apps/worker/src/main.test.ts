import type { Logger } from 'pino';
import { start } from './main';

describe('@modett/worker', () => {
  it('logs one line on start', () => {
    const info = jest.fn();
    // Minimal mock cast to Logger for this unit test.
    const logger = { info } as unknown as Logger;

    start(logger);

    expect(info).toHaveBeenCalledWith('worker started');
  });
});
