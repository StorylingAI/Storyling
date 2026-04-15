import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null) {
  const safeName = name?.trim();
  if (!safeName) return "?";

  return safeName
    .split("@")[0]
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type UserAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function UserAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  return (
    <Avatar className={cn("border", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || "User avatar"} className="object-cover" /> : null}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 text-white font-semibold",
          fallbackClassName
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export { getInitials as getUserInitials };
