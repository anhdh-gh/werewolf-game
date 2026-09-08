import type { PhaseName, RoleKey } from "@/types/game";

export const PHASE_LABELS: Record<PhaseName, string> = {
  REVEAL_ROLE: "Xem vai",
  PAIR_LOVERS: "Ghép đôi",
  NIGHT_FALLS: "Đêm xuống",
  SEER: "Tiên Tri thức dậy",
  SORCERER: "Pháp Sư thức dậy",
  BODYGUARD: "Bảo Vệ thức dậy",
  MUTER: "Kẻ Bịt Miệng thức dậy",
  WOLVES: "Sói thức dậy",
  WITCH_SAVE: "Phù Thuỷ cân nhắc cứu",
  WITCH_KILL: "Phù Thuỷ cân nhắc giết",
  CURSED: "Bị Nguyền thức dậy",
  DAWN: "Rạng sáng",
  DISCUSSION: "Thảo luận",
  VOTE: "Bỏ phiếu",
  VOTE_RESULT: "Kết quả bỏ phiếu",
  ENDED: "Kết thúc",
};

export const ROLE_LABELS: Record<RoleKey, string> = {
  WEREWOLF: "Ma Sói",
  TRAITOR: "Kẻ Phản Bội",
  SEER: "Tiên Tri",
  SORCERER: "Pháp Sư",
  WITCH: "Phù Thuỷ",
  BODYGUARD: "Bảo Vệ",
  HUNTER: "Thợ Săn",
  CUPID: "Thần Tình Yêu",
  MUTER: "Kẻ Bịt Miệng",
  CURSED: "Bị Nguyền",
  LYCAN: "Sói Giả",
  MASON: "Hội Kín",
  PRINCE: "Hoàng Tử",
  PACIFIST: "Người Hoà Bình",
  TANNER: "Chán Đời",
  VILLAGER: "Dân Làng",
};

export const FACTION_LABELS: Record<string, string> = {
  WOLF: "Phe Sói",
  VILLAGE: "Phe Làng",
  TANNER: "Chán Đời",
};
