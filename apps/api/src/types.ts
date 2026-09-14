import type { AuthRepository, LoginSessionRow } from "./modules/auth/repository.js";

export interface AppVariables {
  correlationId: string;
  authRepository: AuthRepository;
  /** Set by requireSession() once the bearer token has been validated — the authenticated principal for this request. */
  session?: LoginSessionRow;
}

export interface AppEnv {
  Variables: AppVariables;
}
