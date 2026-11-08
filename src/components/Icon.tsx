import {
  Calendar, Map, User, Home, ClipboardList, Sprout, FolderOpen, MapPin,
  AlertTriangle, StickyNote, Wrench, CheckCircle2, Bookmark, DollarSign,
  Camera, Paperclip, History,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

const ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  map: Map,
  user: User,
  home: Home,
  clipboard: ClipboardList,
  sprout: Sprout,
  folder: FolderOpen,
  pin: MapPin,
  alert: AlertTriangle,
  note: StickyNote,
  wrench: Wrench,
  check: CheckCircle2,
  bookmark: Bookmark,
  dollar: DollarSign,
  camera: Camera,
  paperclip: Paperclip,
  history: History,
};

interface Props {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export default function Icon({ name, size = 16, color, style }: Props) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} style={style} strokeWidth={2} />;
}
