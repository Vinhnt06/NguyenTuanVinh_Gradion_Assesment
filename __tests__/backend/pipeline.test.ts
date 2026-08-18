import {
  createInitialState,
  writeProjectState,
  readProjectState,
} from '../../lib/storage';
import { executePipelineStep, resetStuckStep } from '../../lib/pipeline';
import fs from 'fs/promises';

const TEST_STORAGE = './storage_pipeline_test';
process.env.STORAGE_PATH = TEST_STORAGE;

describe('Pipeline Orchestrator & Backend Logic', () => {
  const userId = 'usr_pipeline_test';
  const projectId = 'proj_pipeline_test';

  beforeEach(async () => {
    const initialState = createInitialState({
      id: projectId,
      userId,
      title: 'Pipeline Unit Test Book',
      bookText: 'Once upon a time in a river bank...',
    });
    await writeProjectState(userId, projectId, initialState);
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_STORAGE, { recursive: true, force: true });
    } catch {}
  });

  it('prevents running step N if step N-1 is not completed', async () => {
    const result = await executePipelineStep(userId, projectId, 1);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('cannot run before Step 0');
  });

  it('prevents duplicate execution if a step is currently running (409 Conflict)', async () => {
    const state = await readProjectState(userId, projectId);
    state!.stepStates[0] = 'running';
    await writeProjectState(userId, projectId, state!);

    const result = await executePipelineStep(userId, projectId, 0);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.error).toContain('currently running');
  });

  it('resets stranded/stuck steps back to pending', async () => {
    const state = await readProjectState(userId, projectId);
    state!.stepStates[0] = 'running';
    state!.stepStartedAt = new Date().toISOString();
    await writeProjectState(userId, projectId, state!);

    const resetRes = await resetStuckStep(userId, projectId, 0);
    expect(resetRes.success).toBe(true);
    expect(resetRes.state.stepStates[0]).toBe('pending');
    expect(resetRes.state.stepStartedAt).toBeNull();
  });
});
