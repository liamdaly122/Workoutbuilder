import { db } from '../db';
import type { ProgramTemplate } from '../../domain/types';

export async function listProgramTemplates(): Promise<ProgramTemplate[]> {
  return db.programTemplates.toArray();
}

export async function getProgramTemplateById(id: string): Promise<ProgramTemplate | undefined> {
  return db.programTemplates.get(id);
}
