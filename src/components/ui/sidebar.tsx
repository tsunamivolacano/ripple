"use client";

import * as React from "react";
import { Slot, cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const Sidebar = ({ ...props }: React.ComponentProps<"aside">) => {
  return <aside className={cn("flex h-screen w-64 flex-col border-r bg-sidebar", props.className)} {...props} />;
};

const SidebarHeader = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  return (
    <div
      className={cn("flex h-16 shrink-0 items-center px-4 border-b", className)}
      {...props}
    />
  );
};

const SidebarFooter = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  return (
    <div
      className={cn("flex shrink-0 items-center p-4 border-t", className)}
      {...props}
    />
  );
};

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex grow overflow-y-auto px-3 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("relative space-y-2 p-2", className)} {...props} />
  );
};

const SidebarGroupLabel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  );
};

const SidebarGroupContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("space-y-1", className)} {...props} />;
};

const SidebarMenu = ({
  className,
  ...props
}: React.ComponentProps<"nav">) => {
  return (
    <nav className={cn("flex flex-col gap-1", className)} {...props} />
  );
};

const SidebarMenuItem = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      className={cn(
        "group/menu-item flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  }
>(({ className, asChild = false, isActive, tooltip, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  const child = React.Children.toArray(children).find(React.isValidElement) as
    | React.ReactElement
    | undefined;

  const isIconElement = (child: React.ReactElement): boolean => {
    const type = child.type as any;
    return (
      type === "svg" ||
      (typeof type === "object" &&
        type !== null &&
        "displayName" in type &&
        type.displayName?.includes("Icon"))
    );
  };

  const childHasIcon = child && isIconElement(child);

  return (
    <TooltipProvider>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Comp
              ref={ref}
              className={cn(
                "group/menu-item flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
                childHasIcon &&
                  "pl-2 [&>svg]:size-4 [&>svg]:shrink-0",
                className,
              )}
              {...props}
            />
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            sideOffset={4}
            className="hidden group-has-[[data-side=right]]:group-data-[[data-state=delayed-open]]:block group-data-[[data-side=left]]:group-data-[[data-state=delayed-open]]:block"
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Comp
          ref={ref}
          className={cn(
            "group/menu-item flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            childHasIcon && "pl-2 [&>svg]:size-4 [&>svg]:shrink-0",
            className,
          )}
          {...props}
        />
      )}
    </TooltipProvider>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuSub = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("mx-2 my-1 flex w-[calc(100%-1rem)] flex-col space-y-1", className)} {...props} />;
};

const SidebarMenuSubItem = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "group/menu-item flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-sm outline-none ring-sidebar-ring transition-colons hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  const child = React.Children.toArray(children).find(React.isValidElement) as
    | React.ReactElement
    | undefined;

  const isIconElement = (child: React.ReactElement): boolean => {
    const type = child.type as any;
    return (
      type === "svg" ||
      (typeof type === "object" &&
        type !== null &&
        "displayName" in type &&
        type.displayName?.includes("Icon"))
    );
  };

  const childHasIcon = child && isIconElement(child);

  return (
    <Comp
      ref={ref}
      className={cn(
        "group/menu-item flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        childHasIcon && "pl-2 [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && isIconElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
            className: cn(
              "h-4 w-4 shrink-0 [&>svg]:h-4 [&>svg]:w-4",
              "group-data-[collapsible=icon]:-translate-x-1 group-data-[collapsible=icon]:opacity-0",
              child.props.className,
            ),
          });
        }
        return child;
      })}
    </Comp>
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
};