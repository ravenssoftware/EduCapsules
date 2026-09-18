import type { AuthRepository, LoginSessionRow } from "./modules/auth/repository.js";
import type { AuthzRepository } from "./modules/authz/repository.js";
import type { AcademicStructureRepository } from "./modules/academic-structure/repository.js";

export interface AppVariables {
  correlationId: string;
  authRepository: AuthRepository;
  authzRepository: AuthzRepository;
  academicStructureRepository: AcademicStructureRepository;
  /** Set by requireSession() once the bearer token has been validated — the authenticated principal for this request. */
  session?: LoginSessionRow;
}

export interface AppEnv {
  Variables: AppVariables;
}
