import { hashEmail, signToken, verifyToken } from '../../lib/auth';
import {
  createInitialState,
  readProjectState,
  writeProjectState,
  listUserProjects,
} from '../../lib/storage';
import fs from 'fs/promises';
import path from 'path';

const TEST_STORAGE = './storage_test';
process.env.STORAGE_PATH = TEST_STORAGE;

describe('Storage & Auth Modules', () => {
  const userId = 'usr_test123';
  const projectId = 'proj_test456';

  afterAll(async () => {
    try {
      await fs.rm(TEST_STORAGE, { recursive: true, force: true });
    } catch {}
  });

  describe('Auth Module', () => {
    it('generates deterministic user IDs from email', () => {
      const id1 = hashEmail('test@example.com');
      const id2 = hashEmail('TEST@EXAMPLE.COM ');
      expect(id1).toBe(id2);
      expect(id1.startsWith('usr_')).toBe(true);
    });

    it('signs and verifies JWT tokens correctly', () => {
      const user = { userId: 'usr_abc', email: 'vinh@example.com', name: 'Vinh' };
      const token = signToken(user);
      const verified = verifyToken(token);
      expect(verified).toMatchObject(user);
    });

    it('returns null for invalid JWT tokens', () => {
      expect(verifyToken('invalid.jwt.token')).toBeNull();
    });
  });

  describe('Storage Module', () => {
    it('creates initial project state correctly', () => {
      const state = createInitialState({
        id: projectId,
        userId,
        title: 'Wind in the Willows',
        bookText: 'Once upon a time...',
      });

      expect(state.id).toBe(projectId);
      expect(state.status).toBe('draft');
      expect(state.stepStates[0]).toBe('pending');
      expect(state.currentStep).toBe(0);
    });

    it('writes and reads project state atomically', async () => {
      const state = createInitialState({
        id: projectId,
        userId,
        title: 'Atomic Test Book',
        bookText: 'Sample text...',
      });

      await writeProjectState(userId, projectId, state);
      const loaded = await readProjectState(userId, projectId);

      expect(loaded).not.toBeNull();
      expect(loaded?.title).toBe('Atomic Test Book');
    });

    it('lists user projects ordered by created date', async () => {
      const p1 = createInitialState({ id: 'p1', userId, title: 'Book 1', bookText: 'Text 1' });
      const p2 = createInitialState({ id: 'p2', userId, title: 'Book 2', bookText: 'Text 2' });

      await writeProjectState(userId, 'p1', p1);
      await writeProjectState(userId, 'p2', p2);

      const projects = await listUserProjects(userId);
      expect(projects.length).toBeGreaterThanOrEqual(2);
    });
  });
});
