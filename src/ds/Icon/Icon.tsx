import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GripHorizontalIcon,
  GripVerticalIcon,
  InfoIcon,
  Loader2Icon,
  LogOutIcon,
  type LucideIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoonIcon,
  PanelRightIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  Trash2Icon,
  UploadIcon,
  WifiOffIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";

export type IconName =
  | "github"
  | "edit"
  | "save"
  | "trash"
  | "close"
  | "plus"
  | "check"
  | "spinner"
  | "external-link"
  | "chevron-left"
  | "chevron-down"
  | "chevron-up"
  | "search"
  | "info"
  | "warning"
  | "error"
  | "settings"
  | "pin"
  | "file-text"
  | "clock"
  | "grip-vertical"
  | "moon"
  | "sun"
  | "log-out"
  | "refresh-cw"
  | "wifi-off"
  | "upload"
  | "chevron-right"
  | "grip-horizontal"
  | "maximize"
  | "minimize"
  | "panel-right"
  | "calendar";

type IconSize = "4" | "5" | "6";

export type IconProps = {
  name: IconName;
  size?: IconSize;
  spin?: boolean;
  "aria-hidden"?: boolean;
};

const spinStyle = { animationDuration: "0.8s" } as const;

const sizeMap: Record<IconSize, number> = {
  "4": 16,
  "5": 20,
  "6": 24,
};

const icons: Record<Exclude<IconName, "github">, LucideIcon> = {
  edit: PencilIcon,
  save: SaveIcon,
  trash: Trash2Icon,
  close: XIcon,
  plus: PlusIcon,
  check: CheckIcon,
  spinner: Loader2Icon,
  "external-link": ExternalLinkIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-up": ChevronUpIcon,
  search: SearchIcon,
  info: InfoIcon,
  warning: AlertTriangleIcon,
  error: XCircleIcon,
  settings: SettingsIcon,
  pin: PinIcon,
  "file-text": FileTextIcon,
  clock: ClockIcon,
  "grip-vertical": GripVerticalIcon,
  moon: MoonIcon,
  sun: SunIcon,
  "log-out": LogOutIcon,
  "refresh-cw": RefreshCwIcon,
  "wifi-off": WifiOffIcon,
  upload: UploadIcon,
  "chevron-right": ChevronRightIcon,
  "grip-horizontal": GripHorizontalIcon,
  maximize: MaximizeIcon,
  minimize: MinimizeIcon,
  "panel-right": PanelRightIcon,
  calendar: CalendarIcon,
};

function GithubSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function Icon({
  name,
  size = "5",
  spin = false,
  "aria-hidden": ariaHidden = true,
}: IconProps) {
  const px = sizeMap[size];

  if (name === "github") {
    return (
      <span
        className={
          spin
            ? "inline-flex items-center justify-center animate-spin"
            : "inline-flex items-center justify-center"
        }
        aria-hidden={ariaHidden}
        style={spin ? spinStyle : undefined}
      >
        <GithubSvg size={px} />
      </span>
    );
  }

  const IconComponent = icons[name];

  return (
    <span
      className={
        spin
          ? "inline-flex items-center justify-center animate-spin"
          : "inline-flex items-center justify-center"
      }
      aria-hidden={ariaHidden}
      style={spin ? spinStyle : undefined}
    >
      <IconComponent size={px} />
    </span>
  );
}
