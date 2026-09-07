import { OPTIONAL_ROLE_KEYS, type OptionalRoleKey } from "@/types/room";
import type { RoleKey } from "@/types/game";

export function wolfCount(n: number): number {
  return Math.floor((n - 1) / 4) + 1;
}

function assertValidSize(n: number): void {
  if (n < 4 || n > 16) {
    throw new Error("Số người chơi phải từ 4 đến 16");
  }
}

/** Spec §4.2: wolves, then Seer + Witch + ≥1 Villager are mandatory, then the
 * remaining slots are filled in OPTIONAL_ROLE_KEYS order — Wolf- and
 * Village-faction roles first, the sole Riêng (solo) role TANNER always
 * last — skipping any optional role the room disabled. A disabled role's
 * slot rolls over to the next one in line rather than going straight to
 * Villager. */
export function buildRoleList(
  n: number,
  rolesEnabled: Record<OptionalRoleKey, boolean>,
): RoleKey[] {
  assertValidSize(n);

  const wolves = wolfCount(n);
  const roles: RoleKey[] = Array(wolves).fill("WEREWOLF");
  roles.push("SEER", "WITCH");

  let optionalSlots = n - roles.length - 1; // reserve 1 guaranteed villager
  for (const key of OPTIONAL_ROLE_KEYS) {
    if (optionalSlots <= 0) break;
    if (rolesEnabled[key]) {
      roles.push(key);
      optionalSlots--;
    }
  }

  const villagers = n - roles.length;
  for (let i = 0; i < villagers; i++) roles.push("VILLAGER");

  return roles;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function assignRoles(
  uids: string[],
  rolesEnabled: Record<OptionalRoleKey, boolean>,
): Record<string, RoleKey> {
  const roles = shuffle(buildRoleList(uids.length, rolesEnabled));
  const assignment: Record<string, RoleKey> = {};
  uids.forEach((uid, i) => {
    assignment[uid] = roles[i];
  });
  return assignment;
}
