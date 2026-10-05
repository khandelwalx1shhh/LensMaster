import React, { useState } from "react";
import { Info, Ruler, X } from "lucide-react";
import { getProductCategory, type ShopifyProduct } from "@/lib/shopify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface FrameDimensions {
  lensWidth: number | string;
  bridgeWidth: number | string;
  templeLength: number | string;
  frameWidth?: number | string;
  sizeLabel?: string;
}

export function getFrameDimensions(product?: ShopifyProduct["node"] | null): FrameDimensions | null {
  if (!product) return null;
  const category = getProductCategory(product);
  if (category === "contact-lens") return null;

  let lens: number | null = null;
  let bridge: number | null = null;
  let temple: number | null = null;
  let frameWidth: number | null = null;

  // 1. Gather all text sources (descriptionHtml stripped of tags, description, title, SKU, tags)
  const rawHtml = product.descriptionHtml ?? "";
  const cleanHtmlText = rawHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
  const desc = product.description ?? "";
  const title = product.title ?? "";
  const sku = product.variants?.edges?.[0]?.node?.sku ?? "";
  const tags = (product.tags ?? []).join(" ");

  const fullText = `${cleanHtmlText} \n ${desc} \n ${title} \n ${sku} \n ${tags}`;

  // 2. Try matching explicit triplet size: "49-18-143", "49–18–143" (en-dash), "49—18—143" (em-dash), "49/18/143", "49 □ 18 143"
  const tripletMatch = fullText.match(
    /(?:frame\s*size|size)?[:\s-]*(\d{2})\s*[-–—/□\[\]\s]\s*(\d{2})\s*[-–—/□\[\]\s]\s*(\d{3})/i
  );
  if (tripletMatch) {
    const l = parseInt(tripletMatch[1], 10);
    const b = parseInt(tripletMatch[2], 10);
    const t = parseInt(tripletMatch[3], 10);
    if (!isNaN(l)) lens = l;
    if (!isNaN(b)) bridge = b;
    if (!isNaN(t)) temple = t;
  }

  // 3. Try matching specific individual measurements in text
  // e.g. "Lens width: 49 mm", "Bridge width: 18 mm", "Temple length: 143 mm", "Frame width: 135 mm"
  const lensMatch = fullText.match(/(?:lens\s*width|eye\s*size|lens\s*size|lens)[:\s-]+(\d{2})\s*(?:mm)?/i);
  if (lensMatch) {
    const l = parseInt(lensMatch[1], 10);
    if (!isNaN(l)) lens = l;
  }

  const bridgeMatch = fullText.match(/(?:bridge\s*width|bridge\s*size|bridge|dbl)[:\s-]+(\d{2})\s*(?:mm)?/i);
  if (bridgeMatch) {
    const b = parseInt(bridgeMatch[1], 10);
    if (!isNaN(b)) bridge = b;
  }

  const templeMatch = fullText.match(/(?:temple\s*length|temple\s*size|temple|arm\s*length|arm)[:\s-]+(\d{3})\s*(?:mm)?/i);
  if (templeMatch) {
    const t = parseInt(templeMatch[1], 10);
    if (!isNaN(t)) temple = t;
  }

  const frameWidthMatch = fullText.match(/(?:frame\s*width|total\s*width)[:\s-]+(\d{3})\s*(?:mm)?/i);
  if (frameWidthMatch) {
    const fw = parseInt(frameWidthMatch[1], 10);
    if (!isNaN(fw)) frameWidth = fw;
  }

  // 4. Check optical metafields if not found from description
  const meta = product.optical ?? {};
  if (!lens && (meta["lens_width"] || meta["eye_size"] || meta["lensWidth"])) {
    const parsed = parseInt(String(meta["lens_width"] || meta["eye_size"] || meta["lensWidth"]), 10);
    if (!isNaN(parsed)) lens = parsed;
  }
  if (!bridge && (meta["bridge_width"] || meta["bridge"] || meta["bridgeWidth"])) {
    const parsed = parseInt(String(meta["bridge_width"] || meta["bridge"] || meta["bridgeWidth"]), 10);
    if (!isNaN(parsed)) bridge = parsed;
  }
  if (!temple && (meta["temple_length"] || meta["temple"] || meta["templeLength"])) {
    const parsed = parseInt(String(meta["temple_length"] || meta["temple"] || meta["templeLength"]), 10);
    if (!isNaN(parsed)) temple = parsed;
  }

  // 5. Fallback based on category
  const finalLens = lens && !isNaN(lens) ? lens : (category === "kids" ? 44 : 50);
  const finalBridge = bridge && !isNaN(bridge) ? bridge : (category === "kids" ? 16 : 19);
  const finalTemple = temple && !isNaN(temple) ? temple : (category === "kids" ? 125 : 142);
  const totalWidth = frameWidth && !isNaN(frameWidth) ? frameWidth : finalLens * 2 + finalBridge;

  let sizeLabel = "Medium";
  if (totalWidth < 130) sizeLabel = "Narrow";
  else if (totalWidth > 138) sizeLabel = "Wide";

  return {
    lensWidth: finalLens,
    bridgeWidth: finalBridge,
    templeLength: finalTemple,
    frameWidth: totalWidth,
    sizeLabel,
  };
}

export function LensWidthIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Dimension arrow */}
      <line x1="14" y1="12" x2="50" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="19,7 13,12 19,17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="45,7 51,12 45,17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Eyeglass Lens Rim */}
      <path
        d="M12 25 C16 23, 48 23, 52 25 C54 26, 55 29, 53 34 C50 43, 44 54, 32 54 C20 54, 14 43, 11 34 C9 29, 10 26, 12 25 Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Temple hinge nub */}
      <path d="M52 25 L58 27" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M12 25 L6 27" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function BridgeWidthIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Left and right lens curves connected by bridge */}
      <path
        d="M10 44 C14 34, 20 26, 26 24 C29 22, 35 22, 38 24 C44 26, 50 34, 54 44"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Dimension arrow across the bridge gap */}
      <line x1="22" y1="52" x2="42" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="27,47 21,52 27,57" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="37,47 43,52 37,57" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TempleLengthIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Dimension arrow along temple */}
      <line x1="12" y1="14" x2="52" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="18,9 11,14 18,19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="46,9 53,14 46,19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Eyeglass side profile: hinge on left, temple arm extending and curving down at ear */}
      <path
        d="M11 25 L13 36 M13 28 L45 28 C49 28, 53 32, 55 43 L56 47"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function ProductSizeSpec({ product }: { product?: ShopifyProduct["node"] | null }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const dims = getFrameDimensions(product);

  if (!dims) return null;

  return (
    <div className="mt-6 sm:mt-8 pt-6 border-t border-border/70">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Frame Dimensions</p>
          {dims.sizeLabel && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {dims.sizeLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition"
        >
          <Ruler className="h-3.5 w-3.5" />
          Size Guide
        </button>
      </div>

      {/* 3 Size Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Card 1: Lens Width */}
        <div className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-border/60 bg-surface/80 p-3 sm:p-4 text-center transition hover:border-foreground/20 hover:shadow-xs">
          <div className="text-foreground/80 mb-2 flex items-center justify-center">
            <LensWidthIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            Lens Width
          </p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {dims.lensWidth}
            <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">mm</span>
          </p>
        </div>

        {/* Card 2: Bridge Width */}
        <div className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-border/60 bg-surface/80 p-3 sm:p-4 text-center transition hover:border-foreground/20 hover:shadow-xs">
          <div className="text-foreground/80 mb-2 flex items-center justify-center">
            <BridgeWidthIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            Bridge Width
          </p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {dims.bridgeWidth}
            <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">mm</span>
          </p>
        </div>

        {/* Card 3: Temple Length */}
        <div className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-border/60 bg-surface/80 p-3 sm:p-4 text-center transition hover:border-foreground/20 hover:shadow-xs">
          <div className="text-foreground/80 mb-2 flex items-center justify-center">
            <TempleLengthIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            Temple Length
          </p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {dims.templeLength}
            <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">mm</span>
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
        Standard Frame Measurement: <span className="font-medium text-foreground">{dims.lensWidth} - {dims.bridgeWidth} - {dims.templeLength} mm</span>
      </p>

      {/* Size Guide Modal */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Eyewear Size Guide</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              How to find your perfect glasses fit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm pt-2">
            <div className="rounded-xl bg-surface p-3.5 space-y-2 border border-border/60">
              <p className="font-semibold text-xs uppercase tracking-wider text-foreground">Find numbers on your current frame</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Look on the inside of the temple (arm) of any pair of glasses you currently wear. You will find 3 numbers printed, for example: <strong className="text-foreground font-mono">50 □ 19 142</strong>.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-lg border border-border/40">
                <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-[11px] shrink-0">1</div>
                <div>
                  <p className="font-medium text-foreground">Lens Width (e.g. 50 mm)</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Horizontal diameter of one lens at its widest point.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg border border-border/40">
                <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-[11px] shrink-0">2</div>
                <div>
                  <p className="font-medium text-foreground">Bridge Width (e.g. 19 mm)</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Distance between the two lenses across the bridge of your nose.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg border border-border/40">
                <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-[11px] shrink-0">3</div>
                <div>
                  <p className="font-medium text-foreground">Temple Length (e.g. 142 mm)</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Total length of the side arms from hinge to the tip behind your ear.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Need help choosing?</span> Visit our Lens Master store in Jaipur or message us on WhatsApp for personalized frame sizing advice from our certified opticians.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
