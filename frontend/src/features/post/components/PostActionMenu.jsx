import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ────────────────────────────────────────────────────────────────────
//
//  Action shape:
//  {
//    label:       string           — display text
//    onClick:     () => void
//    icon?:       ReactNode        — lucide or any icon element
//    variant?:    'default' | 'destructive' | 'warning'
//    hidden?:     boolean          — excluded from render entirely
//    disabled?:   boolean
//    type?:       'separator' | 'label'   — structural items
//  }
//
// Destructive actions are automatically floated to the bottom
// with their own separator, regardless of definition order.

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isStructural = (a) => a.type === 'separator' || a.type === 'label';

const splitActions = (actions) => {
  const visible = actions.filter((a) => !a.hidden);

  const normal      = visible.filter((a) => isStructural(a) || a.variant !== 'destructive');
  const destructive = visible.filter((a) => !isStructural(a) && a.variant === 'destructive');

  return { normal, destructive };
};

// Removes leading, trailing, and consecutive separators from a list
const cleanSeparators = (actions) =>
  actions.filter((a, i, arr) =>
    !(
      a.type === 'separator' &&
      (i === 0 || i === arr.length - 1 || arr[i - 1].type === 'separator')
    )
  );

// ─── Item styles ──────────────────────────────────────────────────────────────
const ITEM_VARIANTS = {
  default:     'text-foreground/90 focus:text-foreground focus:bg-accent/60',
  warning:     'text-amber-500 focus:text-amber-500 focus:bg-amber-500/10',
  destructive: 'text-destructive focus:text-destructive focus:bg-destructive/10',
};

// ─── Single menu item ─────────────────────────────────────────────────────────
const ActionItem = ({ action }) => {
  const variantClass = ITEM_VARIANTS[action.variant ?? 'default'];

  return (
    <DropdownMenuItem
      disabled={action.disabled}
      className={`
        cursor-pointer text-sm gap-2.5 rounded-lg px-2.5 py-1.5
        transition-colors duration-150
        ${variantClass}
        ${action.disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        if (!action.disabled) action.onClick?.();
      }}
    >
      {action.icon && (
        <span className="w-4 h-4 shrink-0 opacity-70">{action.icon}</span>
      )}
      <span className="flex-1">{action.label}</span>
    </DropdownMenuItem>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const PostActionMenu = ({ actions = [], children }) => {
  const { normal, destructive } = splitActions(actions);
  const cleanedNormal = cleanSeparators(normal);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-48 rounded-xl p-1.5 shadow-lg border border-border/50 bg-popover/95 backdrop-blur-sm"
      >
        {/* Normal actions */}
        {cleanedNormal.map((action, i) => {
          if (action.type === 'separator') return <DropdownMenuSeparator key={i} className="my-1 bg-border/50" />;
          if (action.type === 'label')     return <DropdownMenuLabel key={i} className="text-[11px] text-muted-foreground/70 px-2.5 py-1 font-medium uppercase tracking-wider">{action.label}</DropdownMenuLabel>;
          return <ActionItem key={action.label} action={action} />;
        })}

        {/* Destructive zone — always at the bottom, always separated */}
        {destructive.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            {destructive.map((action) => (
              <ActionItem key={action.label} action={action} />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostActionMenu;
