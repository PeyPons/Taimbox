import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildAgencyAwarePath, useSupportAgencyView } from "@/hooks/useSupportAgencyView";

interface NavLinkProps {
  to: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  /** Si false, no añade ?agency= en vista de soporte (p. ej. /admin). */
  preserveAgency?: boolean;
  /** Enlace externo (p. ej. review.taimbox.com). */
  external?: boolean;
}

export function NavLink({
  to,
  icon: Icon,
  children,
  active,
  className,
  preserveAgency = true,
  external = false,
}: NavLinkProps) {
  const { agencyId } = useSupportAgencyView();
  const isExternal = external || /^https?:\/\//i.test(to);
  const resolvedTo =
    isExternal
      ? to
      : preserveAgency && !to.startsWith('/admin')
        ? buildAgencyAwarePath(to, agencyId)
        : to;

  const classNames = cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium group",
        active 
          ? "bg-primary text-white shadow-md shadow-indigo-900/20" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
        className
  );

  const content = (
    <>
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4 transition-colors',
            active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300',
          )}
        />
      )}
      <span>{children}</span>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={resolvedTo}
        target="_blank"
        rel="noopener noreferrer"
        className={classNames}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={resolvedTo} className={classNames}>
      {content}
    </Link>
  );
}
