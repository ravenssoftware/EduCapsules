import type { AuthRepository, LoginSessionRow } from "./modules/auth/repository.js";
import type { AuthzRepository } from "./modules/authz/repository.js";
import type { ClassroomsRepository } from "./modules/classrooms/repository.js";

export interface AppVariables {
  correlationId: string;
  authRepository: AuthRepository;
  authzRepository: AuthzRepository;
  classroomsRepository: ClassroomsRepository;
  /** Set by requireSession() once the bearer token has been validated — the authenticated principal for this request. */
  session?: LoginSessionRow;
}

export interface AppEnv {
  Variables: AppVariables;
}
