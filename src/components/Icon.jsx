import {
  Calendar, Map, User, Home, ClipboardList, Sprout, FolderOpen, MapPin,
  AlertTriangle, StickyNote, Wrench, CheckCircle2, Bookmark, DollarSign,
  Camera, Paperclip, History,
} from "lucide-react";

const ICONS = {
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

export default function Icon({ name, size = 16, color, style }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} style={style} strokeWidth={2} />;
}
