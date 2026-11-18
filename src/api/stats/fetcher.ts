import { api } from "../../lib/api";
import type { Stats } from "../../lib/types";

export async function getStats() {
  return (await api.get<Stats>("/admin/stats")).data;
}
