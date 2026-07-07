import type { ReactNode } from "react";

import { Card, Chip } from "@heroui/react";
import { useEffect } from "react";

import { useAdminPageActions } from "@/components/admin-shell";

export type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export function AdminPage({
  actions,
  children,
  navbarCenter,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow?: string;
  navbarCenter?: ReactNode;
  title: string;
}) {
  const pageActions = useAdminPageActions();

  useEffect(() => {
    pageActions?.setActions(actions ?? null);
    pageActions?.setCenter(navbarCenter ?? null);

    return () => {
      pageActions?.setActions(null);
      pageActions?.setCenter(null);
    };
  }, [actions, navbarCenter, pageActions]);

  return <div className="flex w-full flex-col gap-6">{children}</div>;
}

export function StatGrid({
  stats,
}: {
  stats: readonly {
    label: string;
    value: string;
    helper: string;
    tone?: StatusTone;
  }[];
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <Card.Header>
            <Card.Title className="text-sm">{stat.label}</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-foreground text-2xl font-semibold tabular-nums">
              {stat.value}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={
                  stat.tone === "warning"
                    ? "bg-warning size-1.5 rounded-full"
                    : stat.tone === "danger"
                      ? "bg-danger size-1.5 rounded-full"
                      : stat.tone === "accent"
                        ? "bg-accent size-1.5 rounded-full"
                        : "bg-success size-1.5 rounded-full"
                }
              />
              <span className="text-muted text-xs">{stat.helper}</span>
            </div>
          </Card.Content>
        </Card>
      ))}
    </section>
  );
}

export function SectionCard({
  action,
  children,
  compactHeader,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  compactHeader?: boolean;
  description?: string;
  title: string;
}) {
  return (
    <Card>
      <Card.Header>
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <Card.Title className="text-base">{title}</Card.Title>
            {description ? (
              <Card.Description
                className={compactHeader ? "text-xs" : "w-full text-xs"}
              >
                {description}
              </Card.Description>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export function StatusPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <Chip color={tone} size="sm" variant="soft">
      {children}
    </Chip>
  );
}
