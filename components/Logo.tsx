import { cn } from '@/lib/utils';

interface LogoProps {
  /** Show just the icon mark (no text) */
  iconOnly?: boolean;
  /** Compact mode for sidebar collapsed state */
  compact?: boolean;
  className?: string;
}

export default function Logo({ iconOnly = false, compact = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {/* V Mark — inline SVG matching the favicon */}
      <svg
        width={compact ? 28 : 32}
        height={compact ? 28 : 32}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="256" height="256" rx="52" fill="#0a0a0c" />
        <rect x="1" y="1" width="254" height="254" rx="51" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="1" />
        <path d="M64 72 L128 184 L192 72" stroke="white" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="128" cy="184" r="16" fill="#10b981" />
        <circle cx="128" cy="184" r="10" fill="#34d399" />
        <circle cx="64" cy="72" r="10" fill="white" />
        <circle cx="192" cy="72" r="10" fill="white" />
        <path d="M64 72 L128 184" stroke="rgba(16,185,129,0.25)" strokeWidth="4" strokeLinecap="round" />
        <path d="M192 72 L128 184" stroke="rgba(16,185,129,0.25)" strokeWidth="4" strokeLinecap="round" />
      </svg>

      {/* Brand text */}
      {!iconOnly && (
        <span className="font-black tracking-[-0.02em] text-white leading-none">
          VOID
        </span>
      )}
    </span>
  );
}
