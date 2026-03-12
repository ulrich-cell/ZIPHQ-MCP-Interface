import { Building2, Globe, Tag, UserCheck, Mail } from "lucide-react";
import type { ZipVendor } from "@/lib/zip-types";

interface VendorCardProps {
  vendor: ZipVendor;
  signerName?: string;
  signerEmail?: string;
}

export function VendorCard({ vendor, signerName, signerEmail }: VendorCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-medium text-muted-foreground">Vendor</h3>
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
            <Globe className="h-4 w-4 shrink-0" />
            <span>{vendor.domain}</span>
          </div>
        )}
        {vendor.category && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4 shrink-0" />
            <span>{vendor.category}</span>
          </div>
        )}
        {(signerName || signerEmail) && (
          <div className="border-t border-border pt-3 space-y-2">
            {signerName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground/60 leading-none mb-0.5">Vendor Signer</p>
                  <p className="text-card-foreground">{signerName}</p>
                </div>
              </div>
            )}
            {signerEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="break-all">{signerEmail}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
