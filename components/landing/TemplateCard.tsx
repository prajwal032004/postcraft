"use client";

import Link from "next/link";
import { Template } from "@/lib/templates";
import TemplateThumb from "@/components/TemplateThumb";

export default function TemplateCard({ tpl, index }: { tpl: Template; index: number }) {
  return (
    <Link href={`/compose?template=${tpl.id}`} className="tpl-card" data-cursor-label="Open">
      <span className="tpl-index">{String(index + 1).padStart(2, "0")}</span>
      <TemplateThumb tpl={tpl} ratio={1.24} eager={index < 2} className="tpl-thumb" />
      <div className="tpl-info">
        <div className="tpl-text">
          <small>{tpl.category}</small>
          <h3 className="h-sub">{tpl.name}</h3>
          <p className="tpl-desc">{tpl.description}</p>
        </div>
        <span className="tpl-open" aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
