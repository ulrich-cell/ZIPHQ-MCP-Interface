import { Building2, Globe, Tag } from "lucide-react";
import type { ZipVendor } from "@/lib/zip-api";

interface VendorCardProps {
  vendor: ZipVendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Vendor
        </h3>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Building2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-card-foreground">{vendor.name}</p>
            {vendor.status && (
              <p className="text-xs text-muted-foreground">{vendor.status}</p>
            )}
          </div>
        </div>
        {vendor.domain && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>{vendor.domain}</span>
          </div>
        )}
        {vendor.category && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />
            <span>{vendor.category}</span>
          </div>
        )}
      </div>
    </div>
  );
}
